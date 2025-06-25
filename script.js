// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDghxF9jjsc1p8afxmX2RqlaR-0gqIc8EI",
  authDomain: "meeting-timer-f1a5c.firebaseapp.com",
  databaseURL: "https://meeting-timer-f1a5c-default-rtdb.firebaseio.com",
  projectId: "meeting-timer-f1a5c",
  storageBucket: "meeting-timer-f1a5c.firebasestorage.app",
  messagingSenderId: "383506528786",
  appId: "1:383506528786:web:d50e103dd1687ef34a36cb"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const ref = db.ref("agendaTimer");

let agenda = [];
let currentIndex = 0;
let remaining = 0;
let interval = null;
let running = false;

// Write to Firebase
function syncState() {
  ref.set({
    agenda: agenda,
    index: currentIndex,
    remaining: remaining,
    running: running
  });
}

// Listen to Firebase
ref.on("value", (snapshot) => {
  const data = snapshot.val();
  if (data) {
    agenda = data.agenda || [];
    currentIndex = data.index;
    remaining = data.remaining;
    running = data.running;
    updateUI();

    if (running && !interval) {
      startLocal();
    } else if (!running && interval) {
      clearInterval(interval);
      interval = null;
    }
  }
});

// Countdown function
function startLocal() {
  interval = setInterval(() => {
    if (remaining > 0) {
      remaining--;
      syncState();

      const warning = document.getElementById("warning-message");

      if (remaining <= 60 && remaining > 0) {
        warning.innerText = "⏳ 1 minute remaining!";
        warning.classList.remove("flash");
      }

    } else {
      clearInterval(interval);
      interval = null;

      const warning = document.getElementById("warning-message");
      warning.innerText = "⏰ Time’s up!";
      warning.classList.add("flash");

      // Stop timer and leave message until manually advanced
      warning.innerText = "⏰ Time’s up!";
      warning.classList.add("flash");
      running = false;
      syncState();

    }
  }, 1000);
}




// Controls
function startTimer() {
  running = true;
  syncState();
}

function pauseTimer() {
  running = false;
  syncState();
}

function resetTimer() {
  if (agenda[currentIndex]) {
    remaining = agenda[currentIndex].duration;
    running = false;
    syncState();
  }
}

function nextItem() {
  if (currentIndex < agenda.length - 1) {
    currentIndex++;
    remaining = agenda[currentIndex].duration;
    running = false;
    syncState();
  }
}

function prevItem() {
  if (currentIndex > 0) {
    currentIndex--;
    remaining = agenda[currentIndex].duration;
    running = false;
    syncState();
  }
}

// Add agenda item
function addAgendaItem() {
  const title = document.getElementById("agenda-title").value.trim();
  const minutes = parseInt(document.getElementById("agenda-duration").value);

  if (!title || isNaN(minutes) || minutes <= 0) {
    alert("Please enter a valid title and duration.");
    return;
  }

  agenda.push({ title: title, duration: minutes * 60 });

  // If it's the first item, initialize
  if (agenda.length === 1) {
    currentIndex = 0;
    remaining = agenda[0].duration;
  }

  syncState();
  updateUI();

}

// UI updates
function updateUI() {
  const ul = document.getElementById("agenda-list");
  ul.innerHTML = "";

  let totalMinutes = 0;

agenda.forEach((item, i) => {
  totalMinutes += Math.floor(item.duration / 60);

  const li = document.createElement("li");
  li.className = "agenda-item";

  // Clickable title
  const titleSpan = document.createElement("span");
  titleSpan.className = "agenda-title-clickable";
  titleSpan.innerText = `${item.title} (${Math.floor(item.duration / 60)} min)`;
  titleSpan.onclick = () => jumpToItem(i);

  // Buttons container
  const buttonsDiv = document.createElement("div");

  const editBtn = document.createElement("button");
  editBtn.innerText = "✏️";
  editBtn.onclick = (e) => {
    e.stopPropagation();
    editItem(i);
  };

  const deleteBtn = document.createElement("button");
  deleteBtn.innerText = "🗑️";
  deleteBtn.onclick = (e) => {
    e.stopPropagation();
    deleteItem(i);
  };

  buttonsDiv.appendChild(editBtn);
  buttonsDiv.appendChild(deleteBtn);

  li.appendChild(titleSpan);
  li.appendChild(buttonsDiv);

  if (i === currentIndex) li.classList.add("active");

  ul.appendChild(li);
});

  const hrs = Math.floor(totalMinutes / 60);
const minsOnly = totalMinutes % 60;
let totalMessage = "This meeting is ";

if (hrs > 0) {
  totalMessage += `${hrs} hour${hrs !== 1 ? "s" : ""}`;
  if (minsOnly > 0) {
    totalMessage += ` ${minsOnly} minute${minsOnly !== 1 ? "s" : ""}`;
  }
  totalMessage += " long.";
} else {
  totalMessage += `${minsOnly} minute${minsOnly !== 1 ? "s" : ""} long.`;
}

document.getElementById("total-duration").innerText = totalMessage;

  const mins = String(Math.floor(remaining / 60)).padStart(2, '0');
  const secs = String(remaining % 60).padStart(2, '0');
  document.getElementById("current-timer").innerText = `${mins}:${secs}`;

  const current = agenda[currentIndex];
  document.getElementById("now-showing").innerText = current ? `Now: ${current.title}` : "Now: --";

  document.getElementById("next-up").innerText =
    (agenda[currentIndex + 1])
      ? `Up next: ${agenda[currentIndex + 1].title}`
      : "Up next: —";
} // ← This closes updateUI()


function deleteItem(index) {
  if (confirm("Are you sure you want to delete this item?")) {
    agenda.splice(index, 1);

    if (currentIndex >= agenda.length) {
      currentIndex = agenda.length - 1;
    }

    if (agenda.length > 0) {
      remaining = agenda[currentIndex].duration;
    } else {
      remaining = 0;
      currentIndex = 0;
    }

    running = false;
    syncState();
    updateUI();
  }
}

function editItem(index) {
  const newTitle = prompt("Edit title:", agenda[index].title);
  const newDuration = prompt("Edit duration in minutes:", agenda[index].duration / 60);

  if (newTitle && !isNaN(newDuration) && Number(newDuration) > 0) {
    agenda[index].title = newTitle.trim();
    agenda[index].duration = Number(newDuration) * 60;

    if (index === currentIndex) {
      remaining = agenda[index].duration;
    }

    syncState();
    updateUI();
  } else {
    alert("Invalid input. Item not updated.");
  }
}

function jumpToItem(index) {
  currentIndex = index;
  remaining = agenda[index].duration;
  running = false;
  syncState();
}

window.onload = () => {
  const date = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
document.getElementById("current-date").innerText = "Today's date is " + date + ".";
};

function toggleMeetingMode() {
  const layout = document.getElementById("main-layout");
  const body = document.body;

  layout.classList.toggle("meeting-mode-layout");
  body.classList.toggle("meeting-mode");
}
