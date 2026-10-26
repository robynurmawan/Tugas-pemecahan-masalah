
const taskForm = document.getElementById("task-form");
const taskName = document.getElementById("task-name");
const taskDate = document.getElementById("task-date");
const taskPriority = document.getElementById("task-priority");
const taskFilter = document.getElementById("task-filter");
const taskList = document.getElementById("task-list");

let tasks = [];

try {
    const savedTasks = JSON.parse(
        localStorage.getItem("smartDailyTasks") || "[]"
    );

    if (Array.isArray(savedTasks)) {
        tasks = savedTasks.filter(task =>
            task &&
            typeof task.id === "number" &&
            typeof task.name === "string" &&
            typeof task.date === "string" &&
            ["Rendah", "Sedang", "Tinggi"].includes(task.priority) &&
            typeof task.completed === "boolean"
        );
    }
} catch (error) {
    tasks = [];
}

function getLocalDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatDate(dateString) {
    const [year, month, day] = dateString.split("-").map(Number);

    return new Date(year, month - 1, day).toLocaleDateString(
        "id-ID",
        {
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );
}

function initializeApp() {
    const today = getLocalDate();

    document.getElementById("today-date").textContent =
        new Date().toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });

    taskDate.min = today;
    taskDate.value = today;

    renderTasks();
}

function saveTasks() {
    try {
        localStorage.setItem(
            "smartDailyTasks",
            JSON.stringify(tasks)
        );
        return true;
    } catch (error) {
        alert("Data gagal disimpan. Periksa penyimpanan browser.");
        return false;
    }
}

taskForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = taskName.value.trim();
    const date = taskDate.value;
    const priority = taskPriority.value;

    if (!name) {
        alert("Nama kegiatan tidak boleh kosong.");
        return;
    }

    if (!date || date < getLocalDate()) {
        alert("Tanggal kegiatan tidak boleh sebelum hari ini.");
        return;
    }

    const newTask = {
        id: Date.now(),
        name: name,
        date: date,
        priority: priority,
        completed: false
    };

    tasks.push(newTask);

    if (!saveTasks()) {
        tasks.pop();
        return;
    }

    taskForm.reset();
    taskDate.value = getLocalDate();
    taskDate.min = getLocalDate();
    taskPriority.value = "Sedang";

    renderTasks();
});

function toggleTask(id) {
    const task = tasks.find(item => item.id === id);

    if (!task) return;

    task.completed = !task.completed;

    if (!saveTasks()) {
        task.completed = !task.completed;
        return;
    }

    renderTasks();
}

function deleteTask(id) {
    const task = tasks.find(item => item.id === id);

    if (!task) return;

    const confirmed = confirm(
        `Apakah Anda yakin ingin menghapus kegiatan "${task.name}"?`
    );

    if (!confirmed) return;

    const previousTasks = [...tasks];
    tasks = tasks.filter(item => item.id !== id);

    if (!saveTasks()) {
        tasks = previousTasks;
        return;
    }

    renderTasks();
}

function renderTasks() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;

    document.getElementById("total-tasks").textContent = total;
    document.getElementById("pending-tasks").textContent = pending;
    document.getElementById("completed-tasks").textContent = completed;

    const percentage = total === 0
        ? 0
        : Math.round((completed / total) * 100);

    document.getElementById("progress-text").textContent =
        `${percentage}%`;

    document.getElementById("progress-bar").style.width =
        `${percentage}%`;

    const filter = taskFilter.value;

    let filteredTasks = tasks.filter(task => {
        if (filter === "Belum") return !task.completed;
        if (filter === "Selesai") return task.completed;
        return true;
    });

    // Prioritas tinggi ditampilkan lebih dahulu.
    const priorityOrder = {
        Tinggi: 1,
        Sedang: 2,
        Rendah: 3
    };

    filteredTasks.sort((a, b) => {
        if (a.completed !== b.completed) {
            return Number(a.completed) - Number(b.completed);
        }

        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        }

        return a.date.localeCompare(b.date);
    });

    taskList.replaceChildren();

    if (filteredTasks.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty-state";
        empty.textContent = tasks.length === 0
            ? "Belum ada kegiatan. Yuk, tambahkan kegiatan pertamamu!"
            : "Tidak ada kegiatan pada filter ini.";

        taskList.appendChild(empty);
        return;
    }

    filteredTasks.forEach(task => {
        const item = document.createElement("article");
        item.className = "task-item";

        if (task.completed) {
            item.classList.add("done");
        }

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "task-check";
        checkbox.checked = task.completed;
        checkbox.setAttribute(
            "aria-label",
            `Tandai ${task.name} sebagai selesai`
        );

        checkbox.addEventListener("change", () => {
            toggleTask(task.id);
        });

        const content = document.createElement("div");
        content.className = "task-content";

        const title = document.createElement("h3");
        title.textContent = task.name;

        const date = document.createElement("p");
        date.textContent = `Tanggal: ${formatDate(task.date)}`;

        const meta = document.createElement("div");
        meta.className = "task-meta";

        const priority = document.createElement("span");
        priority.className = `priority ${task.priority}`;
        priority.textContent = `Prioritas ${task.priority}`;

        const status = document.createElement("span");
        status.className = "priority " +
            (task.completed ? "Rendah" : "Sedang");
        status.textContent = task.completed
            ? "Selesai"
            : "Belum selesai";

        meta.append(priority, status);
        content.append(title, date, meta);

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-button";
        deleteButton.textContent = "Hapus";

        deleteButton.addEventListener("click", () => {
            deleteTask(task.id);
        });

        item.append(checkbox, content, deleteButton);
        taskList.appendChild(item);
    });
}

taskFilter.addEventListener("change", renderTasks);

initializeApp();
