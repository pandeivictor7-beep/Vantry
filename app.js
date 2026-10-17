
"use strict";

const KEY = "vyntra_data_v1";
const $ = s => document.querySelector(s);
const makeId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const escapeHTML = s => String(s ?? "").replace(/[&<>"']/g, c => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[c]));

function freshData() {
  return {
    user: {
      name: "Vyntra User",
      handle: "@vyntra_user",
      bio: "Building my world, one step at a time.",
      location: "Kenya"
    },
    posts: [
      {
        id: makeId(), author: "Vyntra Team", handle: "@vyntra",
        text: "Welcome to Vyntra! ✨ Share your ideas, connect with people and build your community.",
        likes: [], comments: [], time: Date.now()
      }
    ],
    stories: [
      {id:makeId(),name:"Your story",text:""},
      {id:makeId(),name:"Maya",text:"Keep moving forward ✨"},
      {id:makeId(),name:"Jay",text:"Working on something new."}
    ],
    chats: [
      {id:"welcome",name:"Vyntra Welcome",messages:[
        {from:"Vyntra Team",text:"Welcome! This is a local demo chat.",time:Date.now()}
      ]}
    ],
    groups: [
      {id:"creators",name:"Creators Corner",members:["Vyntra User","Maya"],messages:[
        {from:"Maya",text:"Welcome to the group!",time:Date.now()}
      ]}
    ],
    following: [],
    openComments: [],
    activeChat: null
  };
}

let data;
try {
  data = JSON.parse(localStorage.getItem(KEY)) || freshData();
} catch {
  data = freshData();
}

let page = "home";
let search = "";

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (e) {
    alert("Storage is full. Remove large photos or export your data.");
  }
}

function avatar(name) {
  return `<div class="avatar">${escapeHTML((name || "?")[0].toUpperCase())}</div>`;
}

function timeAgo(time) {
  const mins = Math.floor((Date.now() - time) / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return mins + "m ago";
  if (mins < 1440) return Math.floor(mins / 60) + "h ago";
  return Math.floor(mins / 1440) + "d ago";
}

function navigate(p) {
  page = p;
  render();
  window.scrollTo(0, 0);
}

function render() {
  document.querySelectorAll("[data-page]").forEach(b => {
    b.classList.toggle("active", b.dataset.page === page);
  });

  $("#headerAvatar").textContent = (data.user.name || "V")[0].toUpperCase();

  const app = $("#app");
  if (!app) return;

  if (page === "home") app.innerHTML = homePage();
  if (page === "chats") app.innerHTML = chatsPage();
  if (page === "groups") app.innerHTML = groupsPage();
  if (page === "search") app.innerHTML = searchPage();
  if (page === "profile") app.innerHTML = profilePage();

  bindEvents();
}

function homePage() {
  return `
    <h2>Your world, in one place.</h2>

    <div class="stories">
      ${data.stories.map((s,i) => `
        <button class="story" data-story="${i}">
          ${avatar(i === 0 ? "+" : s.name)}
          <div class="muted">${escapeHTML(s.name)}</div>
        </button>
      `).join("")}
    </div>

    <section class="composer">
      <div class="row">
        ${avatar(data.user.name)}
        <strong>Share something</strong>
      </div>
      <br>
      <textarea id="postText" maxlength="1200"
        placeholder="What's on your mind?"></textarea>
      <br><br>
      <div class="row">
        <input type="file" id="postImage" accept="image/*">
      </div>
      <br>
      <button class="btn primary" id="publish">Publish post</button>
    </section>

    <div id="feed">
      ${data.posts.slice().sort((a,b)=>b.time-a.time).map(postCard).join("")}
    </div>
  `;
}

function postCard(p) {
  const liked = p.likes.includes(data.user.handle);
  const opened = data.openComments.includes(p.id);

  return `
    <article class="post">
      <div class="post-head">
        ${avatar(p.author)}
        <div>
          <strong>${escapeHTML(p.author)}</strong>
          <div class="muted">${escapeHTML(p.handle)} · ${timeAgo(p.time)}</div>
        </div>
      </div>

      <div class="post-text">${escapeHTML(p.text)}</div>

      ${p.image ? `<img src="${p.image}" alt="Post photo"
        style="width:100%;max-height:350px;object-fit:cover;border-radius:12px">` : ""}

      <div class="post-actions">
        <button data-like="${p.id}" class="${liked ? "liked" : ""}">
          ${liked ? "♥" : "♡"} ${p.likes.length} Likes
        </button>
        <button data-comments="${p.id}">
          ▢ ${p.comments.length} Comments
        </button>
        <button data-share="${p.id}">↗ Share</button>
        ${p.handle === data.user.handle
          ? `<button data-delete="${p.id}">Delete</button>` : ""}
      </div>

      ${opened ? `
        <div>
          ${p.comments.map(c => `
            <div class="comment">
              <strong>${escapeHTML(c.author)}</strong>
              ${escapeHTML(c.text)}
            </div>
          `).join("")}

          <form data-comment-form="${p.id}">
            <div class="row">
              <input name="comment" maxlength="300"
                placeholder="Write a comment..." required>
              <button class="btn primary">Send</button>
            </div>
          </form>
        </div>
      ` : ""}
    </article>
  `;
}

function chatsPage() {
  const chat = data.chats.find(c => c.id === data.activeChat);

  if (chat) return chatView(chat, false);

  return `
    <h2>Messages</h2>
    <div class="notice">Local demo only. Messages are not delivered to other users.</div>
    <section class="panel">
      <div class="row">
        <strong>Your conversations</strong>
        <div class="spacer"></div>
        <button class="btn primary" id="newChat">+ New chat</button>
      </div>
    </section>
    <div class="list">
      ${data.chats.map(c => chatItem(c,false)).join("")}
    </div>
  `;
}

function groupsPage() {
  const group = data.groups.find(g => g.id === data.activeChat);

  if (group) return chatView(group, true);

  return `
    <h2>Communities</h2>
    <div class="notice">Create local demo groups. Live group messaging is not connected.</div>
    <section class="panel">
      <div class="row">
        <strong>Your groups</strong>
        <div class="spacer"></div>
        <button class="btn primary" id="newGroup">+ Create group</button>
      </div>
    </section>
    <div class="list">
      ${data.groups.map(g => chatItem(g,true)).join("")}
    </div>
  `;
}

function chatItem(c, isGroup) {
  const last = c.messages[c.messages.length - 1];

  return `
    <button class="chat" data-open-chat="${c.id}" data-group="${isGroup}">
      ${avatar(c.name)}
      <div class="chat-name">
        <strong>${escapeHTML(c.name)}</strong>
        <div class="muted">${escapeHTML(last ? last.text : "No messages yet")}</div>
      </div>
    </button>
  `;
}

function chatView(c, isGroup) {
  return `
    <section class="panel">
      <div class="row">
        <button class="btn" id="backChat">← Back</button>
        <strong>${escapeHTML(c.name)}</strong>
      </div>

      ${isGroup ? `<p class="muted">Members: ${c.members.map(escapeHTML).join(", ")}</p>` : ""}

      <div class="messages" id="messages">
        ${c.messages.map(m => `
          <div class="bubble ${m.from === data.user.name ? "mine" : ""}">
            <strong>${escapeHTML(m.from)}</strong><br>
            ${escapeHTML(m.text)}
            <div class="muted">${timeAgo(m.time)}</div>
          </div>
        `).join("")}
      </div>

      <form id="messageForm" data-chat-id="${c.id}" data-group="${isGroup}">
        <div class="row">
          <input name="message" maxlength="1200"
            placeholder="Write a message..." required>
          <button class="btn primary">Send</button>
        </div>
      </form>
    </section>
  `;
}

function searchPage() {
  const q = search.toLowerCase();

  const results = data.posts.filter(p =>
    (p.author + " " + p.handle + " " + p.text).toLowerCase().includes(q)
  );

  return `
    <h2>Discover</h2>
    <section class="panel">
      <input id="searchInput" placeholder="Search people and posts..."
        value="${escapeHTML(search)}">
    </section>

    ${q ? results.map(postCard).join("") || "<p>No results found.</p>" : `
      <h3>Suggested people</h3>
      ${["Maya","Jay","Sam","Nia"].map(name => `
        <div class="chat">
          ${avatar(name)}
          <div class="chat-name">${escapeHTML(name)}</div>
          <button class="btn" data-follow="${name}">
            ${data.following.includes(name) ? "Following" : "Follow"}
          </button>
        </div>
        <br>
      `).join("")}
    `}
  `;
}

function profilePage() {
  return `
    <h2>My profile</h2>
    <section class="panel">
      <div class="row">
        ${avatar(data.user.name)}
        <div>
          <strong>${escapeHTML(data.user.name)}</strong>
          <div class="muted">${escapeHTML(data.user.handle)}</div>
        </div>
      </div>

      <p>${escapeHTML(data.user.bio)}</p>
      <div class="muted">${escapeHTML(data.user.location)}</div>
      <hr style="border-color:#2b2d43">

      <h3>Edit profile</h3>
      <form id="profileForm">
        <label class="muted">Display name</label><br>
        <input name="name" maxlength="45" required
          value="${escapeHTML(data.user.name)}"><br><br>

        <label class="muted">Username</label><br>
        <input name="handle" maxlength="30" required
          value="${escapeHTML(data.user.handle)}"><br><br>

        <label class="muted">Bio</label><br>
        <textarea name="bio" maxlength="240">${escapeHTML(data.user.bio)}</textarea><br><br>

        <label class="muted">Location</label><br>
        <input name="location" maxlength="60"
          value="${escapeHTML(data.user.location)}"><br><br>

        <button class="btn primary">Save profile</button>
      </form>

      <br>
      <button class="btn" id="exportData">Export demo data</button>
      <button class="btn" id="resetData">Reset demo</button>
    </section>
  `;
}

function bindEvents() {
  $("#publish")?.addEventListener("click", async () => {
    const text = $("#postText").value.trim();
    const file = $("#postImage").files[0];

    if (!text && !file) return alert("Write a post or choose a photo.");

    let image = "";

    if (file) {
      if (!file.type.startsWith("image/")) return alert("Choose an image.");
      if (file.size > 700000) {
        return alert("Choose a photo under 700 KB for this demo.");
      }

      image = await new Promise((resolve,reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      }).catch(() => "");

      if (!image) return alert("Could not read that photo.");
    }

    data.posts.unshift({
      id:makeId(), author:data.user.name, handle:data.user.handle,
      text, image, likes:[], comments:[], time:Date.now()
    });

    save();
    render();
  });

  document.querySelectorAll("[data-like]").forEach(b => {
    b.addEventListener("click", () => {
      const p = data.posts.find(x => x.id === b.dataset.like);
      if (!p) return;

      const h = data.user.handle;
      p.likes = p.likes.includes(h)
        ? p.likes.filter(x => x !== h)
        : [...p.likes,h];

      save();
      render();
    });
  });

  document.querySelectorAll("[data-comments]").forEach(b => {
    b.addEventListener("click", () => {
      const id = b.dataset.comments;
      data.openComments = data.openComments.includes(id)
        ? data.openComments.filter(x => x !== id)
        : [...data.openComments,id];

      render();
    });
  });

  document.querySelectorAll("[data-comment-form]").forEach(f => {
    f.addEventListener("submit", e => {
      e.preventDefault();
      const p = data.posts.find(x => x.id === f.dataset.commentForm);
      const text = new FormData(f).get("comment").trim();

      if (!p || !text) return;

      p.comments.push({author:data.user.name,text});
      save();
      render();
    });
  });

  document.querySelectorAll("[data-delete]").forEach(b => {
    b.addEventListener("click", () => {
      if (!confirm("Delete your post?")) return;
      data.posts = data.posts.filter(p => p.id !== b.dataset.delete);
      save();
      render();
    });
  });

  document.querySelectorAll("[data-share]").forEach(b => {
    b.addEventListener("click", async () => {
      const p = data.posts.find(x => x.id === b.dataset.share);
      if (!p) return;

      const text = `${p.author} on Vyntra: ${p.text}`;

      try {
        if (navigator.share) {
          await navigator.share({title:"Vyntra",text});
        } else {
          prompt("Copy this post text:",text);
        }
      } catch {}
    });
  });

  document.querySelectorAll("[data-story]").forEach(b => {
    b.addEventListener("click", () => {
      const i = Number(b.dataset.story);

      if (i === 0) {
        const text = prompt("Write your story:");
        if (text && text.trim()) {
          data.stories[0].text = text.trim();
          save();
          render();
        }
      } else {
        alert(data.stories[i].text || "No story available.");
      }
    });
  });

  $("#newChat")?.addEventListener("click", () => {
    const name = prompt("Enter the person's display name:");
    if (!name?.trim()) return;

    const c = {
      id:makeId(),name:name.trim(),messages:[]
    };

    data.chats.unshift(c);
    data.activeChat = c.id;
    save();
    render();
  });

  $("#newGroup")?.addEventListener("click", () => {
    const name = prompt("Enter your group name:");
    if (!name?.trim()) return;

    const names = prompt("Demo member names, separated by commas:") || "";

    data.groups.unshift({
      id:makeId(),
      name:name.trim(),
      members:[data.user.name,...names.split(",").map(x=>x.trim()).filter(Boolean)],
      messages:[]
    });

    data.activeChat = data.groups[0].id;
    save();
    render();
  });

  document.querySelectorAll("[data-open-chat]").forEach(b => {
    b.addEventListener("click", () => {
      data.activeChat = b.dataset.openChat;
      page = b.dataset.group === "true" ? "groups" : "chats";
      save();
      render();
    });
  });

  $("#backChat")?.addEventListener("click", () => {
    data.activeChat = null;
    save();
    render();
  });

  $("#messageForm")?.addEventListener("submit", e => {
    e.preventDefault();

    const form = e.currentTarget;
    const text = new FormData(form).get("message").trim();
    if (!text) return;

    const list = form.dataset.group === "true" ? data.groups : data.chats;
    const chat = list.find(c => c.id === form.dataset.chatId);
    if (!chat) return;

    chat.messages.push({
      from:data.user.name,
      text,
      time:Date.now()
    });

    save();
    render();

    const messages = $("#messages");
    if (messages) messages.scrollTop = messages.scrollHeight;
  });

  $("#searchInput")?.addEventListener("input", e => {
    const pos = e.target.selectionStart;
    search = e.target.value;
    render();

    const input = $("#searchInput");
    if (input) {
      input.focus();
      input.setSelectionRange(pos,pos);
    }
  });

  document.querySelectorAll("[data-follow]").forEach(b => {
    b.addEventListener("click", () => {
      const name = b.dataset.follow;

      data.following = data.following.includes(name)
        ? data.following.filter(x => x !== name)
        : [...data.following,name];

      save();
      render();
    });
  });

  $("#profileForm")?.addEventListener("submit", e => {
    e.preventDefault();

    const f = new FormData(e.currentTarget);
    data.user.name = f.get("name").trim();
    data.user.handle = f.get("handle").trim().replace(/\s/g,"_");
    if (!data.user.handle.startsWith("@")) data.user.handle = "@"+data.user.handle;
    data.user.bio = f.get("bio").trim();
    data.user.location = f.get("location").trim();

    save();
    alert("Profile saved on this device.");
    render();
  });

  $("#exportData")?.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(data,null,2)], {
      type:"application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vyntra-data.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url),1000);
  });

  $("#resetData")?.addEventListener("click", () => {
    if (!confirm("Reset all locally saved Vyntra demo data?")) return;
    data = freshData();
    save();
    page = "home";
    render();
  });
}

document.querySelectorAll("[data-page]").forEach(b => {
  b.addEventListener("click", () => {
    data.activeChat = null;
    navigate(b.dataset.page);
  });
});

$("#searchShortcut")?.addEventListener("click", () => navigate("search"));

render();
