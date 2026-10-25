/* Durable investigations, owned sources, and recoverable real-model requests. */
(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const ui = () => window.FrameSeekSessionUI;
  const store = () => window.FrameSeekWorkbench;
  const demo = {id:"demo_parcel",name:"包裹移动 · 合成演示",metadata:{duration:18,audio:false},job:{state:"ready"}};
  const labels = { queued:"等待预检", probing:"检查素材", captioning:"理解画面", transcribing:"转写音轨", indexing:"建立索引", ready:"可以提问", failed:"处理失败", cancelled:"已取消", awaiting_configuration:"等待模型配置" };
  let session, current, currentVideo = demo, suspended = true, saving = null, lastSaved = "", lastSavedEdits = "", timer;
  let conflict = false, requestEpoch = 0, activeRequest = null, libraryEpoch = 0;
  let pendingSave = null;
  let lastVideoDesks = {};
  try {
    const saved = JSON.parse(localStorage.getItem("frameseek-video-desks") || "{}");
    if (saved && typeof saved === "object" && !Array.isArray(saved)) lastVideoDesks = saved;
  } catch {}
  const owns = (id, epoch) => current?.id === id && requestEpoch === epoch;
  let sourceChoices = new Map([[demo.id, demo]]), sourceListEpoch = 0, sourceSwitching = false;
  let searchEpoch = 0, searchDesk = null, searchGeneration = null;
  function syncSourceSwitcher(videos) {
    $('search-index').hidden = currentVideo.id === demo.id || currentVideo.job?.state !== 'ready';
    if(searchDesk && (searchDesk !== current?.id || searchGeneration !== currentVideo.generation)) {
      searchEpoch++; searchDesk=null; $('visual-search-dialog').close();
    }
    if (videos) sourceChoices = new Map([[demo.id, demo], ...videos.map(video => [video.id, video])]);
    sourceChoices.set(currentVideo.id, currentVideo);
    const select = $("source-switcher");
    select.replaceChildren();
    for (const video of sourceChoices.values()) {
      const option = document.createElement("option");
      option.value = video.id; option.textContent = video.id === demo.id ? "箱子 · 包裹移动（合成演示）" : video.name;
      option.dataset.thumbnail = video.id === demo.id ? "/media/demo_parcel/frames/0.jpg" : video.metadata?.preview?.[0]?.uri || "";
      const duration = Math.round(video.metadata?.duration || 0);
      option.dataset.detail = `${Math.floor(duration / 60).toString().padStart(2,"0")}:${(duration % 60).toString().padStart(2,"0")} · ${video.id === demo.id ? "合成演示" : labels[video.job?.state] || "已上传"}`;
      select.append(option);
    }
    select.value = currentVideo.id;
    select.disabled = sourceSwitching;
    if (select.dispatchEvent) select.dispatchEvent(new Event("frameseek-sources"));
  }
  async function refreshSourceSwitcher() {
    const deskId = current?.id, epoch = requestEpoch, token = ++sourceListEpoch;
    const data = await api("/api/videos");
    if (owns(deskId, epoch) && token === sourceListEpoch) syncSourceSwitcher(data.items);
  }
  async function switchSelectedSource() {
    const video = sourceChoices.get($("source-switcher").value);
    if (!video || video.id === currentVideo.id || sourceSwitching) { syncSourceSwitcher(); return; }
    sourceSwitching = true; syncSourceSwitcher();
    try { await openSource(video); }
    catch (error) { ui().notify(`切换视频失败：${error.message}。当前调查和输入已保留。`); }
    finally { sourceSwitching = false; syncSourceSwitcher(); }
  }

  function status(text, kind="") { $("save-state").textContent = kind === "saved" ? "已保存 ✓" : text; $("save-state").title = text; $("save-state").dataset.state = kind; }
  async function api(path, method="GET", body) {
    const response = await fetch(path, {method, credentials:"same-origin", cache:"no-store",
      headers: body ? {"Content-Type":"application/json", "X-FS-CSRF":session.csrf} : method !== "GET" ? {"X-FS-CSRF":session.csrf} : {},
      body: body ? JSON.stringify(body) : undefined });
    const data = response.status === 204 ? null : await response.json();
    if (!response.ok) { const error = new Error(data?.detail || "request_failed"); error.status=response.status; error.data=data; throw error; }
    return data;
  }
  const snapshot = () => ui().snapshot();
  function editSnapshot(state) {
    const {playerTime, ...panelState}=state.ui || {};
    return JSON.stringify({...state,ui:panelState});
  }
  function remember() {
    lastVideoDesks[currentVideo.id] = current.id;
    try {
      localStorage.setItem("frameseek-current", current.id);
      localStorage.setItem("frameseek-video-desks", JSON.stringify(lastVideoDesks));
    } catch {}
  }
  const draftShadowKey='frameseek-draft-shadow';
  function keepDraftShadow(base) {
    if(suspended || !current || !session?.owner_id)return;
    try {
      if(base===undefined)base=lastSaved ? JSON.parse(lastSaved).ui?.draft || '' : '';
      sessionStorage.setItem(draftShadowKey,JSON.stringify({owner:session.owner_id,desk:current.id,
        generation:currentVideo.generation || 0,epoch:store().getSnapshot().epoch || 0,
        base,text:$('question').value,expires:Date.now()+3600000,
        pendingDraft:pendingSave?.desk===current.id ? pendingSave.draft : null,
        pendingRevision:pendingSave?.desk===current.id ? pendingSave.revision+1 : null}));
    }catch{}
  }
  function recoverDraftShadow() {
    try {
      const saved=JSON.parse(sessionStorage.getItem(draftShadowKey) || 'null');
      if(!saved || saved.expires<Date.now() || typeof saved.text!=='string' || saved.text.length>4000
        || saved.owner!==session.owner_id || saved.desk!==current.id
        || saved.generation!==(currentVideo.generation || 0)
        || saved.epoch!==(store().getSnapshot().epoch || 0))return false;
      const pendingBase=current.revision===saved.pendingRevision && $('question').value===saved.pendingDraft;
      if($('question').value!==saved.base && $('question').value!==saved.text && !pendingBase)return false;
      if($('question').value===saved.text)return false;
      ui().restoreDraft(saved.text);return true;
    }catch{return false;}
  }
  async function flush() {
    if (saving) {
      const desk=current;
      await saving;
      if (current!==desk) return;
      if (editSnapshot(snapshot())!==lastSavedEdits) return flush();
      return;
    }
    if (suspended || conflict || !current) return;
    const state=snapshot(), encoded=JSON.stringify(state), edits=editSnapshot(state);
    if (encoded === lastSaved) return;
    const desk = current;
    status("正在保存…");
    pendingSave={desk:desk.id,revision:desk.revision,draft:state.ui?.draft || ''};
    keepDraftShadow();
    saving = api(`/api/investigations/${desk.id}`, "PUT", {revision:desk.revision,state:JSON.parse(encoded)})
      .then(result => { desk.revision=result.revision; lastSaved=encoded; lastSavedEdits=edits; status("已保存到本机","saved");
        if(current===desk) {
          if($('question').value===(state.ui?.draft || '')) {try{sessionStorage.removeItem(draftShadowKey);}catch{}}
          else keepDraftShadow(state.ui?.draft || '');
        }
      })
      .catch(error => { conflict=error.status===409; status(conflict ? "其他页面已修改 · 请重新打开" : "保存失败 · 点击重试", "error"); throw error; })
      .finally(() => { saving=null; pendingSave=null; });
    await saving;
    if (current!==desk) return;
    if (editSnapshot(snapshot())!==lastSavedEdits) return flush();
  }
  function changed() {
    if (suspended || conflict) return;
    status("有未保存修改"); clearTimeout(timer);
    timer=setTimeout(() => flush().catch(() => {}),500);
  }
  async function openDesk(id) {
    const previousId=current?.id, epoch=++requestEpoch;
    ui().busy(true);
    try {
      await flush(); if (!owns(previousId,epoch)) return false;
      await stopRequest(); if (!owns(previousId,epoch)) return false;
      const desk=await api(`/api/investigations/${id}`);
      if (!owns(previousId,epoch)) return false;
      const video=desk.video === "demo_parcel" ? demo : await api(`/api/videos/${desk.video}`);
      if (!owns(previousId,epoch)) return false;
      await flush(); if (!owns(previousId,epoch)) return false;
      if (desk.id===previousId && !conflict && current.revision>desk.revision) {desk.state=snapshot();desk.revision=current.revision;}
      suspended=true;
      current=desk; currentVideo=video; conflict=false;
      ui().restore({...desk.state,title:desk.state.title || desk.title},video);
      const restored=snapshot();lastSaved=JSON.stringify(restored);lastSavedEdits=editSnapshot(restored);
      remember(); syncSourceSwitcher(); status("已恢复调查","saved");
      $("workspace-library").close();
      suspended=false;
      if(recoverDraftShadow())changed();
      await recover();
      if (!owns(desk.id,epoch)) return false;
      if (["queued","probing","captioning","transcribing","indexing"].includes(video.job?.state)) watch(video.id,epoch);
      refreshChatBudget();
      return true;
    } finally { if (epoch===requestEpoch) {suspended=false;ui().busy(false);} }
  }
  async function create(video=demo) {
    const previousId=current?.id, epoch=++requestEpoch;
    ui().busy(true);
    try {
      await flush(); if (!owns(previousId,epoch)) return false;
      await stopRequest(); if (!owns(previousId,epoch)) return false;
      const desk=await api("/api/investigations","POST",{video_id:video.id,title:video.id === "demo_parcel" ? "未命名调查" : video.name.replace(/\.[^.]+$/, "")});
      if (!owns(previousId,epoch)) return false;
      await flush(); if (!owns(previousId,epoch)) return false;
      suspended=true;
      current=desk;
      currentVideo=video; conflict=false;
      ui().applySource(video); store().rename(current.title);
      lastSaved=""; lastSavedEdits="";remember(); syncSourceSwitcher();
      suspended=false;
      await flush(); if (!owns(desk.id,epoch)) return false;
      $("workspace-library").close();
      if (["queued","probing","captioning","transcribing","indexing"].includes(video.job?.state)) watch(video.id,epoch);
      refreshChatBudget();
      return true;
    } finally { if (epoch===requestEpoch) {suspended=false;ui().busy(false);} }
  }
  function item(title, detail, action, actionLabel="打开") {
    const row=document.createElement("article"); row.className="library-row";
    const copy=document.createElement("div"); const name=document.createElement("strong"); name.textContent=title;
    const meta=document.createElement("small");meta.textContent=detail;copy.append(name,meta);row.append(copy);
    const button=document.createElement("button");button.className="outline-button";button.textContent=actionLabel;
    button.onclick=()=>Promise.resolve(action()).catch(error=>libraryNotice(error.message));row.append(button);return row;
  }
  function libraryNotice(message) { $("library-notice").textContent=message; }
  let budgetEpoch=0,preflightNotice=false;
  async function refreshChatBudget() {
    const line=$('chat-budget-status');
    if(!line)return;
    const desk=current?.id,epoch=requestEpoch,check=++budgetEpoch;
    if(currentVideo.id==='demo_parcel') {line.hidden=true;return;}
    try {
      const data=await api('/api/runtime/status');
      if(check!==budgetEpoch || !owns(desk,epoch))return;
      const b=data.budget;
      line.hidden=false;
      line.textContent=b && b.remaining_calls===0
        ? `模型请求已用完 ${b.call_cap} / ${b.call_cap} 次；不会再调用模型，已有回答和证据仍可回看。`
        : !data.dispatch_prerequisites_met
        ? '真实聊天暂未就绪，可在「更多 → 模型与预算」检查；已有证据仍可回看。'
        : b?.visual_search_calls === 1 ? `剩余 ${b.remaining_calls} / ${b.call_cap} 次模型请求 · 视觉查找通常预留1次，复核最多8张索引候选；不代表已穷举全片。`
        : b ? `剩余 ${b.remaining_calls} / ${b.call_cap} 次模型请求 · 指定不超过60秒的时段通常预留 ${b.short_window_calls} 次；跨时段检索需要更多。`
        : '预算状态未确认，请先检查模型与预算；不代表可以发送。';
    }catch(error){if(check===budgetEpoch && owns(desk,epoch)){line.hidden=false;line.textContent='预算状态读取失败，发送前仍需通过账本检查；不会自动调用模型。';}}
  }
  async function showRuntime() {
    const dialog=$("agent-setup-dialog"), button=$("refresh-agent-setup");
    if(!dialog.open) dialog.showModal();
    button.disabled=true;$("agent-setup-summary").textContent="正在读取本机配置…";
    try {
      const data=await api("/api/runtime/status");
      const provider=data.provider==="gemini" ? "Gemini · AI Builder Cup" : data.provider==="tokenfactory" ? "NVIDIA Nemotron · Token Factory" : "NVIDIA / Nebius";
      $("agent-setup-summary").textContent=data.dispatch_prerequisites_met
        ? `${provider}：聊天准入条件齐备，已有索引的视频可直接提问，无需重新分析。检查仅读取配置和账本，不能证明每个回答准确。`
        : `${provider}：真实分析尚未就绪。演示、上传预检、播放和调查保存仍可使用。`;
      const list=$("agent-readiness-checks");list.replaceChildren();
      for(const check of data.checks) {
        const row=document.createElement("article");row.className="agent-check";
        const heading=document.createElement("strong");heading.textContent=check.label;
        const state=document.createElement("span");state.textContent=check.state==="available" ? "已提供" : "待准备";state.dataset.state=check.state;
        const detail=document.createElement("p");detail.textContent=check.detail;
        row.append(heading,state,detail);list.append(row);
      }
      const models=$("agent-model-roles");models.replaceChildren();
      for(const model of data.models) {
        const row=document.createElement("p");row.textContent=`${model.label}${model.optional ? "（可选）" : ""} · ${model.configured ? `${model.model} / ${model.revision} · ${model.key_present ? "凭据已配置" : "缺少凭据"}` : "未配置"}`;
        models.append(row);
      }
    }catch(error){$("agent-setup-summary").textContent=`读取失败：${error.message}。可重新检查。`;}
    finally {button.disabled=false;}
  }
  async function searchSavedFrames() {
    const question=$('question').value.trim();
    if(!question) {ui().notify('先在输入框描述要找的内容，再查找已有画面；不会发送给模型。');return;}
    const desk=current?.id, epoch=requestEpoch, source=currentVideo, generation=source.generation, check=++searchEpoch;
    if(!desk || source.id===demo.id || source.job?.state!=='ready')return;
    const dialog=$('visual-search-dialog'), list=$('visual-search-results');
    searchDesk=desk; searchGeneration=generation; list.replaceChildren();
    $('visual-search-summary').textContent='正在检索已有索引，不调用模型…';
    if(!dialog.open)dialog.showModal();
    try {
      const data=await api(`/api/videos/${source.id}/search-index`,'POST',
        {question,generation});
      if(check!==searchEpoch || !owns(desk,epoch) || currentVideo.generation!==generation || !dialog.open)return;
      $('visual-search-summary').textContent=`已检索 ${data.indexed_frames} 张保存画面，列出 ${data.frames.length} 张候选。依据原有描述排序及时间探索，尚未逐项视觉复核；候选不等于满足全部条件，未列出也不代表不存在。没有新增模型调用。`;
      for(const frame of data.frames) {
        if(!frame.uri.startsWith(`/media/${source.id}/frames/`))continue;
        const row=document.createElement('article'), image=document.createElement('img');
        const caption=document.createElement('p'), button=document.createElement('button');
        image.src=frame.uri; image.alt='原视频已保存的候选画面';
        caption.textContent=frame.caption;
        const seconds=Math.floor(frame.t);
        button.textContent=`回看 ${Math.floor(seconds/60).toString().padStart(2,'0')}:${(seconds%60).toString().padStart(2,'0')} · 索引候选`;
        button.type='button';button.onclick=()=>{
          if(check!==searchEpoch || !owns(desk,epoch) || currentVideo.id!==source.id || currentVideo.generation!==generation)return;
          dialog.close();ui().seek(frame.t,button);
        };
        row.append(image,caption,button);list.append(row);
      }
    } catch(error) {
      if(check===searchEpoch && owns(desk,epoch) && dialog.open)
        $('visual-search-summary').textContent=`索引暂不可用：${error.message}。原问题和聊天保留，未调用模型。`;
    }
  }
  async function library(kind="investigations") {
    const deskId=current?.id, epoch=requestEpoch, token=++libraryEpoch;
    const active=()=>owns(deskId,epoch) && token===libraryEpoch;
    await flush(); if (!active()) return; libraryNotice("");
    $("library-title").textContent=kind === "videos" ? "素材库" : "调查库";
    $("library-intro").textContent=kind === "videos" ? "每段素材独立保存问题与证据。上传后先预检，再按已批准预算分析。" : `调查保存在这台电脑的服务中，默认保留 ${session.ttl_hours} 小时。继续上次的路径，或开启新调查。`;
    $("library-add").textContent=kind === "videos" ? "上传视频" : "新建调查";
    $("library-add").onclick=()=>{
      if(kind === "videos") {$("workspace-library").close();$("file-input").click();}
      else create(currentVideo).catch(e=>libraryNotice(e.message));
    };
    const body=$("library-items");body.replaceChildren();
    $("workspace-library").showModal();
    if (kind === "videos") {
      body.append(item(demo.name,"18 秒 · 公开合成演示 · 预设回答",()=>openSource(demo)));
      const data=await api("/api/videos");
      if (!active()) return;
      syncSourceSwitcher(data.items);
      for (const video of data.items) {
        const job=video.job;
        const row=item(video.name,`${Math.round(video.bytes/1024/1024)} MB · ${labels[job?.state] || "已上传"}${job?.total ? ` · ${job.completed}/${job.total} 窗口` : ""}`,()=>openSource(video));
        if (["failed","cancelled"].includes(job?.state) && !video.metadata?.windows) {
          const retry=document.createElement("button");retry.className="outline-button";retry.textContent="重新预检";
          retry.onclick=async()=>{try {await api(`/api/videos/${video.id}/retry`,"POST");libraryNotice("已重新开始预检。");if(currentVideo.id===video.id) watch(video.id,requestEpoch);}catch(e){libraryNotice(e.message);}};
          row.append(retry);
        } else if (["awaiting_configuration","failed","cancelled"].includes(job?.state)) {
          const analyze=document.createElement("button");analyze.className="outline-button";analyze.textContent="开始分析";
          analyze.disabled=!session.real_ready || !video.metadata?.windows;
          analyze.title=analyze.disabled ? "需要模型服务、有效校准记录和已批准预算" : "使用已批准预算分析完整素材";
          analyze.onclick=async()=>{try {await api(`/api/videos/${video.id}/analyze`,"POST"); libraryNotice("已受理分析。点击刷新查看真实阶段。"); if (currentVideo.id===video.id) watch(video.id,requestEpoch);}catch(e){libraryNotice(e.message);}};
          row.append(analyze);
        }
        if (["queued","probing","captioning","transcribing","indexing"].includes(job?.state)) {
          const cancel=document.createElement("button");cancel.className="text-button";cancel.textContent="取消";
          cancel.onclick=async()=>{await api(`/api/videos/${video.id}/cancel`,"POST");await library("videos");};row.append(cancel);
        }
        const rename=document.createElement("button");rename.className="text-button";rename.textContent="重命名";
        rename.onclick=()=>renameSource(video);row.append(rename);
        const remove=document.createElement("button");remove.className="text-button danger";remove.textContent="删除";
        remove.setAttribute("aria-label",`删除素材：${video.name}`);
        remove.onclick=()=>confirmDelete(video,"videos");row.append(remove);body.append(row);
      }
      if (!session.real_ready) libraryNotice("真实分析等待模型地址与预算配置。上传、预检、播放和调查保存已可使用。");
    } else {
      const data=await api("/api/investigations");
      if (!active()) return;
      for (const desk of data.items) {
        const row=item(desk.title,`${desk.video === "demo_parcel" ? "演示素材" : "真实素材"} · ${new Date(desk.updated*1000).toLocaleString()}${desk.id===current?.id ? " · 当前" : ""}`,()=>openDesk(desk.id));
        const remove=document.createElement("button");remove.className="text-button danger";remove.textContent="删除";
        remove.onclick=()=>confirmDelete(desk,"investigations");row.append(remove);body.append(row);
      }
    }
    $("library-refresh").onclick=()=>library(kind).catch(e=>libraryNotice(e.message));
  }
  function renameSource(video) {
    $("rename-source-input").value=video.name;
    $("rename-source-form").onsubmit=async event=>{
      event.preventDefault();
      try {
        const result=await api(`/api/videos/${video.id}`,"PATCH",{name:$("rename-source-input").value});
        if(currentVideo.id===video.id) {currentVideo={...currentVideo,name:result.name};ui().renameSource(result.name);}
        syncSourceSwitcher();
        $("rename-source-dialog").close();await library("videos");
      } catch(error) {libraryNotice(error.message);}
    };
    $("rename-source-cancel").onclick=()=>$("rename-source-dialog").close();
    $("rename-source-dialog").showModal();$("rename-source-input").focus();
  }
  function confirmDelete(entity,table) {
    $("delete-description").textContent=table === "videos" ? `删除「${entity.name}」及其所有调查、证据和原文件？` : `删除调查「${entity.title}」？`;
    $("delete-confirm").onclick=async()=>{
      const deskId=current?.id;
      const deletingCurrent=(table === "videos" && current?.video===entity.id) || deskId===entity.id;
      const epoch=deletingCurrent ? ++requestEpoch : requestEpoch;
      if (deletingCurrent) ui().busy(true);
      try {
        if (deletingCurrent) {
          await flush(); if (!owns(deskId,epoch)) return;
          await stopRequest(); if (!owns(deskId,epoch)) return;
          suspended=true;
        }
        await api(`/api/${table}/${entity.id}`,"DELETE");
        if (!owns(deskId,epoch)) return;
        $("delete-dialog").close();
        suspended=false;
        if (deletingCurrent) { current=null; if (!await create(demo)) return; }
        await library(table);
      } catch(e) {if (owns(deskId,epoch)) {$("delete-dialog").close();libraryNotice(e.message);}}
      finally {if (epoch===requestEpoch) {suspended=false;if (deletingCurrent) ui().busy(false);}}
    };
    $("delete-dialog").showModal();
  }
  async function openSource(video) {
    const deskId=current?.id, epoch=++requestEpoch;
    ui().busy(true);
    try {
      await flush(); if (!owns(deskId,epoch)) return false;
      const desks=(await api("/api/investigations")).items.filter(d=>d.video===video.id);
      if (!owns(deskId,epoch)) return false;
      if (desks.length) {
        const remembered = desks.find(desk => desk.id === lastVideoDesks[video.id]);
        return await openDesk((remembered || desks[0]).id);
      }
      return await create(video);
    } finally {if (owns(deskId,epoch)) ui().busy(false);}
  }
  async function upload(file) {
    if (!file.type.startsWith("video/") || file.size > 500*1024**2) {ui().notify("请选择不超过 500 MB 的视频文件。");return;}
    try {
      const deskId=current?.id, epoch=requestEpoch;
      await flush();if (!owns(deskId,epoch)) return;ui().notify(`正在上传 ${file.name} · 0%`);
      const result=await new Promise((resolve,reject)=>{
        const xhr=new XMLHttpRequest();xhr.open("POST","/api/videos");
        xhr.setRequestHeader("Content-Type",file.type);xhr.setRequestHeader("X-FS-CSRF",session.csrf);
        xhr.setRequestHeader("X-File-Name",encodeURIComponent(file.name));xhr.timeout=180000;
        xhr.upload.onprogress=e=>{if(owns(deskId,epoch) && e.lengthComputable)ui().notify(`正在上传 ${file.name} · ${Math.round(e.loaded/e.total*100)}%`);};
        xhr.onload=()=>{let data;try {data=JSON.parse(xhr.responseText);}catch{reject(new Error("上传响应无效"));return;}xhr.status===201 ? resolve(data) : reject(new Error(data.detail || "上传失败"));};
        xhr.onerror=()=>reject(new Error("上传连接中断，原调查已保留。"));xhr.ontimeout=xhr.onerror;xhr.send(file);
      });
      if (!owns(deskId,epoch)) return;
      const video=await api(`/api/videos/${result.id}`);if (!owns(deskId,epoch)) return;
      if (!await create(video)) return;
      ui().notify("上传完成，服务端正在预检素材。可在素材库查看进度。");
      ui().showSource();
    }catch(error){ui().notify(error.message);}
  }
  async function watch(videoId, epoch) {
    const deskId=current?.id;
    for (let i=0;i<90 && owns(deskId,epoch);i++) {
      await new Promise(r=>setTimeout(r,2000));
      if (!owns(deskId,epoch)) return;
      try {
        const video=await api(`/api/videos/${videoId}`);
        if (!owns(deskId,epoch)) return;
        ui().notify(`${labels[video.job?.state] || "处理素材"}${video.job?.total ? ` · ${video.job.completed}/${video.job.total} 窗口` : ""}`);
        if (["ready","failed","awaiting_configuration","cancelled"].includes(video.job?.state)) {
          await flush(); if (!owns(deskId,epoch)) return;
          currentVideo=video; const saved=snapshot();suspended=true;
          try {ui().restore(saved,video);} finally {suspended=false;}
          syncSourceSwitcher();
          refreshChatBudget();
          changed();
          if (video.job?.state === "failed") ui().notify(`预检或分析失败：${video.job.error}。素材保留，可重新处理或删除。`);
          if (video.job?.state === "awaiting_configuration") ui().notify("预检完成，等待模型服务与预算配置。不会发送模型请求。");
          return;
        }
      }catch(error){if (owns(deskId,epoch)) ui().notify(error.message);return;}
    }
  }
  async function recover() {
    if (!current || currentVideo.id === "demo_parcel") return;
    const deskId=current.id, epoch=requestEpoch, initialDraft=$("question").value;
    $('resume-query').hidden=true;
    const data = await api(`/api/investigations/${deskId}/requests`);
    if (!owns(deskId,epoch)) return;
    const existing=new Set(store().getSnapshot().records.map(r=>r.query.id));
    const completed=data.items.filter(r=>r.state === "done" && r.result?.response?.schema_version).slice(0,12).reverse();
    let added=false;
    for (const request of completed) {
      if (!existing.has(request.id)) {
        const parent=store().getSnapshot().records.find(r=>r.query.id===request.input?.parent_request_id);
        ui().answer({...request.result,parentTurn:parent?.id || null});
        added=true;
      }
      if (activeRequest?.desk===deskId && activeRequest.id===request.id) activeRequest=null;
    }
    let draft=$("question").value;
    for (const request of data.items) {
      if (request.state === "done" && activeRequest?.desk===deskId && activeRequest.id===request.id) activeRequest=null;
      if (["running","unknown"].includes(request.state)) {
        if (!draft && initialDraft===draft && request.input) draft=request.input.question;
        if (!activeRequest) activeRequest={desk:deskId,id:request.id,state:request.state};
        else if (activeRequest.desk===deskId && activeRequest.id===request.id) activeRequest.state=request.state;
        ui().notify(request.state === "unknown" ? "先前调用结果不确定，不会自动重复调用。原问题已保留。" : "先前查询仍在执行；点击恢复查询获取结果。");
        $('resume-query').hidden=false;
      }
    }
    ui().restoreDraft(draft);
    if (added || draft!==initialDraft) {await flush();if (!owns(deskId,epoch)) return;}
  }
  async function ask(question) {
    if (suspended || !current || currentVideo.job?.state!=="ready") return;
    if (activeRequest?.state!=="unknown" && activeRequest) {
      $('resume-query').hidden=false;ui().notify("查询仍在执行，请恢复当前请求，勿发起重复尝试。");return;
    }
    const desk=current,epoch=requestEpoch;
    const context=ui().currentContext();
    const parentTurn=context?.mode==="real" ? store().getSnapshot().records.find(r=>r.query.id===context.id)?.id || null : null;
    const body={investigation_id:desk.id,request_id:crypto.randomUUID().replaceAll("-",""),
      generation:store().getSnapshot().epoch,question,parent_request_id:context?.mode==="real" ? context.id : null};
    ui().busy(true);
    let pending=null;
    try {
      await flush(); if (!owns(desk.id,epoch)) return;
      if (activeRequest) {await stopRequest();if (!owns(desk.id,epoch)) return;}
      const prepared=await api("/api/chat/prepare","POST",body);
      if(!owns(desk.id,epoch)) return;
      if (prepared.kind!=="ready") {preflightNotice=true;ui().notify(prepared.message);return;}
      preflightNotice=false;
      pending={desk:desk.id,id:body.request_id,state:"running"};activeRequest=pending;
      status("正在查找证据…");
      let data;
      for (let i=0;i<15;i++) {
        try {data=await api("/api/chat","POST",body);}catch(error){if(error.data?.kind==="query_control") {data=error.data;}else if(error.data?.response) {data=error.data;} else throw error;}
        if(data?.response && activeRequest===pending) activeRequest=null;
        if(!owns(desk.id,epoch)) return;
        if(data.kind!=="query_control") break;
        if(data.state==="unknown") {pending.state="unknown";$('resume-query').hidden=false;ui().notify(data.suggested_action);status("调用结果不确定","error");return;}
        await new Promise(r=>setTimeout(r,Math.min(10000,3000+i*500)));
        if (!owns(desk.id,epoch)) return;
      }
      if(data?.response) {
        $('resume-query').hidden=true;
        if (!store().getSnapshot().records.some(r=>r.query.id===data.id)) ui().answer({...data,parentTurn},question);
        ui().notify("");await flush();if (!owns(desk.id,epoch)) return;
      } else {$('resume-query').hidden=false;ui().notify("查询仍在执行，保留原问题。请从当前请求恢复，勿发起重复尝试。");}
    }catch(error){if(owns(desk.id,epoch)){if(activeRequest===pending && pending) $('resume-query').hidden=false;ui().notify(error.message === "context_has_no_verified_anchor"
      ? "所选问题没有有效证据，请点击「另起问题」并写出完整问题。输入已保留。"
      : `${error.message} · 原问题已保留。`);status("查找未完成","error");}}
    finally {if(owns(desk.id,epoch)) {ui().busy(false);refreshChatBudget();}}
  }
  async function stopRequest() {
    const pending=activeRequest;
    if(!pending) return;
    await api(`/api/investigations/${pending.desk}/requests/${pending.id}/cancel`,"POST");
    if (activeRequest===pending) activeRequest=null;
  }
  async function start() {
    if(!ui()?.ready())return;
    try {
      session=await api("/api/session");
      let id;try{id=localStorage.getItem("frameseek-current");}catch{}
      const desks=(await api("/api/investigations")).items;
      suspended=false;
      if(id && desks.some(d=>d.id===id))await openDesk(id);
      else if(desks.length)await openDesk(desks[0].id);else await create(demo);
      store().subscribe(changed);
      window.addEventListener("frameseek-canvas-changed",changed);
      ["pointerup","keyup","wheel","input"].forEach(event=>document.addEventListener(event,()=>{if(JSON.stringify(snapshot())!==lastSaved)changed();},{passive:true}));
      $('question').addEventListener('input',()=>{keepDraftShadow();if(preflightNotice){preflightNotice=false;ui().notify('');}});
      document.addEventListener("visibilitychange",()=>{if(document.hidden)flush().catch(()=>{});});
      $("open-investigations").onclick=()=>library().catch(e=>ui().notify(e.message));
      $("open-sources").onclick=()=>library("videos").catch(e=>ui().notify(e.message));
      $("open-agent-setup").disabled=false;
      $("open-agent-setup").onclick=showRuntime;
      $("refresh-agent-setup").onclick=showRuntime;
      $("close-agent-setup").onclick=()=>$("agent-setup-dialog").close();
      $('search-index').onclick=searchSavedFrames;
      $('close-visual-search').onclick=()=>{searchEpoch++;$('visual-search-dialog').close();};
      $("save-state").onclick=()=>conflict ? openDesk(current.id).catch(e=>ui().notify(e.message)) : flush().catch(()=>{});
      $("resume-query").onclick=()=>recover().catch(e=>ui().notify(e.message));
      $("source-switcher").onchange=switchSelectedSource;
      refreshSourceSwitcher().catch(error=>ui().notify(`视频列表读取失败：${error.message}。可在管理视频中重试。`));
      $("close-library").onclick=()=>$("workspace-library").close();
      $("delete-cancel").onclick=()=>$("delete-dialog").close();
    }catch(error){suspended=true;status("调查服务暂不可用","error");ui().notify(error.message);}
  }
  window.FrameSeekPersistence={flush,upload,ask,library,openDemo:()=>openSource(demo).catch(e=>ui().notify(e.message)),
    newInvestigation:()=>create(currentVideo).catch(e=>ui().notify(e.message))};
  window.addEventListener("frameseek-catalog-ready",start,{once:true});
  if(ui()?.ready())start();
})();
