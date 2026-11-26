
import { useState, useEffect } from "react";
import "./App.css";
import Auth from "./Auth";
import { supabase } from "./supabaseClient";

function App() {
  const currentHour = new Date().getHours();

const greeting =
  currentHour < 12
    ? "Good morning"
    : currentHour < 17
    ? "Good afternoon"
    : "Good evening";
  const [session, setSession] = useState(null);
const [authLoading, setAuthLoading] = useState(true);
const [authMode, setAuthMode] = useState("register");

const handleLogout = async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    alert("Logout failed: " + error.message);
    return;
  }

  setAuthMode("login");
  setSession(null);
};

useEffect(() => {
  supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
      console.error("Session error:", error.message);
    }

    setSession(data?.session ?? null);
    setAuthLoading(false);
  });

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    setSession(session);
    setAuthLoading(false);
  });

  return () => subscription.unsubscribe();
}, []);

const [tasks, setTasks] = useState(() => {
  const savedTasks = localStorage.getItem("taskflow-tasks");

  if (savedTasks) {
    const existingTasks = JSON.parse(savedTasks);

    return existingTasks.map(task => ({
      ...task,
      deadline: task.deadline || "2026-11-30"
    }));
  }
  return [
    {
      id: 1,
      title: "Complete website design",
      category: "Design",
      priority: "High",
      done: false,
      deadline: "2026-11-27"
    },
    {
      id: 2,
      title: "Review project proposal",
      category: "Work",
      priority: "Medium",
      done: true,
      deadline: "2026-11-28"
    },
    {
      id: 3,
      title: "Prepare client presentation",
      category: "Meeting",
      priority: "High",
      done: false,
      deadline: "2026-11-29"
    },
    {
      id: 4,
      title: "Update project documentation",
      category: "Work",
      priority: "Low",
      done: false,
      deadline: "2026-12-01"
    }
  ];
});
const [isDarkMode, setIsDarkMode] = useState(() => {
  return localStorage.getItem("taskflow-theme") !== "light";
});

const [userName, setUserName] = useState("");
const [userEmail, setUserEmail] = useState("");
const [profilePicture, setProfilePicture] = useState("");

useEffect(() => {
  const loadUserProfile = async () => {
    if (!session?.user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", session.user.id)
      .maybeSingle();

    if (error) {
      console.error("Profile loading error:", error.message);
      return;
    }

    setUserName(
      data?.full_name ||
      session.user.user_metadata?.full_name ||
      "User"
    );

    setUserEmail(session.user.email || "");

    setProfilePicture(data?.avatar_url || "");
  };

  loadUserProfile();
}, [session]);


  useEffect(() => {
    localStorage.setItem("taskflow-tasks", JSON.stringify(tasks));
  }, [tasks]);
useEffect(() => {
  document.documentElement.setAttribute(
    "data-theme",
    isDarkMode ? "dark" : "light"
  );

  localStorage.setItem(
    "taskflow-theme",
    isDarkMode ? "dark" : "light"
  );
}, [isDarkMode]);
 const [showForm, setShowForm] = useState(false);
const [activePage, setActivePage] = useState("Dashboard");
const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
const [newTask, setNewTask] = useState("");
const [newPriority, setNewPriority] = useState("Medium");
const [newCategory, setNewCategory] = useState("General");
const [newDeadline, setNewDeadline] = useState("");
const [search, setSearch] = useState("");
const [taskFilter, setTaskFilter] = useState("All");
const [editingTask, setEditingTask] = useState(null);
const completed = tasks.filter(task => task.done).length;
const pending = tasks.length - completed;
const upcomingTasks = tasks
  .filter(task => !task.done && task.deadline)
  .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
  .slice(0, 5);
const highPriority = tasks.filter(
  task => task.priority === "High" && !task.done
).length;

const completionRate = tasks.length > 0
  ? Math.round((completed / tasks.length) * 100)
  : 0;

const categoryStats = [
  ...new Set(tasks.map(task => task.category || "General"))
].map(category => ({
  category,
  count: tasks.filter(
    task => (task.category || "General") === category
  ).length
}));

const maxCategoryTasks = Math.max(
  ...categoryStats.map(item => item.count),
  1
);


function saveTask(e) {
  e.preventDefault();

  if (!newTask.trim()) return;

  if (editingTask) {
    setTasks(tasks.map(task =>
      task.id === editingTask.id
        ? {
            ...task,
            title: newTask,
priority: newPriority,
category: newCategory,
deadline: newDeadline || editingTask.deadline || ""
          }
        : task
    ));

    setEditingTask(null);

  } else {
    setTasks([
      ...tasks,
      {
        id: Date.now(),
        title: newTask,
        category: newCategory,
priority: newPriority,
deadline: newDeadline,
done: false
      }
    ]);
  }

  setNewTask("");
  setNewPriority("Medium");
  setNewCategory("General");
setNewDeadline("");
  setShowForm(false);
}

function toggleTask(id) {
  setTasks(tasks.map(task =>
    task.id === id
      ? { ...task, done: !task.done }
      : task
  ));
}
function deleteTask(id) {
  setTasks(tasks.filter(task => task.id !== id));
}
const filteredTasks = tasks.filter(task => {
  const matchesSearch = task.title
    .toLowerCase()
    .includes(search.toLowerCase());

  const matchesFilter =
    taskFilter === "All" ||
    (taskFilter === "Pending" && !task.done) ||
    (taskFilter === "Completed" && task.done);

  return matchesSearch && matchesFilter;
});

  if (authLoading) {
    return <div className="auth-page">Loading TaskFlow...</div>;
  }

  if (!session) {
  return (
    <Auth
      onAuthSuccess={setSession}
      initialMode={authMode}
    />
  );
}
return (
    <div className="app">

      <aside className="sidebar">
       <div className="sidebar-header">

  <button
    className="mobile-menu-button"
    type="button"
    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
    aria-label="Toggle navigation"
  >
    ☰
  </button>

  <h2 className="logo">Task<span>Flow.</span></h2>

</div>

<p className="menu-label">MENU</p>

<div className={`sidebar-nav ${mobileMenuOpen ? "open" : ""}`}>

  <div
    className={`nav-item ${activePage === "Dashboard" ? "active" : ""}`}
    onClick={() => {
      setActivePage("Dashboard");
      setMobileMenuOpen(false);
    }}
  >
    ▦ &nbsp; Dashboard
  </div>

  <div
    className={`nav-item ${activePage === "My Tasks" ? "active" : ""}`}
    onClick={() => {
      setActivePage("My Tasks");
      setMobileMenuOpen(false);
    }}
  >
    ☷ &nbsp; My Tasks
  </div>

  <div
    className={`nav-item ${activePage === "Calendar" ? "active" : ""}`}
    onClick={() => {
      setActivePage("Calendar");
      setMobileMenuOpen(false);
    }}
  >
    ◷ &nbsp; Calendar
  </div>

  <div
    className={`nav-item ${activePage === "Settings" ? "active" : ""}`}
    onClick={() => {
      setActivePage("Settings");
      setMobileMenuOpen(false);
    }}
  >
    ⚙ &nbsp; Settings
  </div>

</div>

        
<div className="sidebar-bottom">
  <div className="avatar">
    {profilePicture ? (
      <img
        src={profilePicture}
        alt={userName}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          borderRadius: "50%"
        }}
      />
    ) : (
      (userName || "User")
        .split(" ")
        .map(word => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    )}
  </div>

  <div>
    <strong>{userName || "User"}</strong>
    <small>{userEmail || "Personal Account"}</small>
  </div>
</div>
</aside>

      <main className="main-content">

        
<header className="topbar">
  <div>
    <h3>{activePage}</h3>
    <p>
      {activePage === "Dashboard"
        ? "Manage your tasks and stay productive."
        : activePage === "My Tasks"
        ? "View and manage all your tasks."
        : activePage === "Calendar"
        ? "Keep track of your upcoming deadlines."
        : "Manage your TaskFlow preferences."}
    </p>
  </div>
  <div className="top-avatar">
  {profilePicture ? (
    <img src={profilePicture} alt="Profile" />
  ) : (
    userName ? userName.charAt(0).toUpperCase() : "U"
  )}
</div>
</header>


        {activePage === "Dashboard" && (
  <>
    <section className="welcome">
      <div>
        <p className="welcome-label">YOUR WORKSPACE</p>
        <h1>{greeting}, {userName || "User"}! 👋</h1>
            <p>Here's what's happening with your tasks today.</p>
          </div>

          <button className="add-button" onClick={() => setShowForm(!showForm)}>
            + Add New Task
          </button>
        </section>

        {showForm && (
          <form className="task-form" onSubmit={saveTask}>
            <input
              value={newTask}
              onChange={e => setNewTask(e.target.value)}
              placeholder="Enter your task..."
              autoFocus
            />
            <select
  className="priority-select"
  value={newCategory}
  onChange={e => setNewCategory(e.target.value)}
>
  <option value="General">General</option>
  <option value="Work">Work</option>
  <option value="Design">Design</option>
  <option value="Meeting">Meeting</option>
  <option value="Personal">Personal</option>
  <option value="Study">Study</option>
</select>

<input
  type="date"
  value={newDeadline}
  onChange={e => setNewDeadline(e.target.value)}
/>

            <select
              value={newPriority}
              onChange={e => setNewPriority(e.target.value)}
              className="priority-select"
            >
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>

            <button type="submit">Save Task</button>

            <button
              type="button"
              className="cancel-button"
              onClick={() => {
  setShowForm(false);
  setEditingTask(null);
  setNewTask("");
  setNewPriority("Medium");
  setNewCategory("General");
  setNewDeadline("");
}}
            >
              Cancel
            </button>
          </form>
        )}

        <section className="stats">

          <div className="stat-card">
            <div className="stat-icon blue">▦</div>
            <p>Total Tasks</p>
            <h2>{tasks.length}</h2>
            <small>All your tasks</small>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">✓</div>
            <p>Completed</p>
            <h2>{completed}</h2>
            <small>Tasks finished</small>
          </div>

          <div className="stat-card">
            <div className="stat-icon orange">◷</div>
            <p>Pending</p>
            <h2>{pending}</h2>
            <small>Tasks remaining</small>
          </div>
          <div className="stat-card">
  <div className="stat-icon red">!</div>
  <p>High Priority</p>
  <h2>{highPriority}</h2>
  <small>Tasks needing attention</small>
</div>

        </section>
        <section className="productivity-section">
  <div className="productivity-heading">
    <div>
      <h2>Task Completion</h2>
      <p>Your overall productivity progress</p>
    </div>

    <strong>{completionRate}%</strong>
  </div>

  <div className="progress-track">
  <div
    className="progress-fill"
    style={{ width: `${completionRate}%` }}
  ></div>
</div>

  <small>
    {completed} out of {tasks.length} tasks completed
  </small>
</section>

<section className="chart-section">

<div className="section-heading">
  <div>
    <h2>Tasks by Category</h2>
<p>See how your tasks are distributed across categories.</p>
  </div>
</div>


  <div className="category-chart">
    {categoryStats.map(item => (
      <div className="chart-item" key={item.category}>
        <div className="chart-label">
          <span>{item.category}</span>
          <strong>{item.count}</strong>
        </div>

        <div className="chart-track">
          <div
            className="chart-fill"
            style={{
              width: `${(item.count / maxCategoryTasks) * 100}%`
            }}
          ></div>
        </div>
      </div>
    ))}
  </div>
</section>
<section className="upcoming-section">
  <div className="section-heading">
    <div>
      <h2>Upcoming Deadlines</h2>
      <p>Tasks that need your attention</p>
    </div>

    <span>{upcomingTasks.length} Tasks</span>
  </div>

  <div className="upcoming-list">
    {upcomingTasks.length > 0 ? (
      upcomingTasks.map(task => (
        <div className="upcoming-task" key={task.id}>
          <div>
            <h3>{task.title}</h3>
            <small>{task.category}</small>
          </div>

          <div className="deadline-info">
            <span>{task.priority}</span>
            <small>
              {new Date(task.deadline).toLocaleDateString()}
            </small>
          </div>
        </div>
      ))
    ) : (
      <p>No upcoming deadlines.</p>
    )}
  </div>
</section>
  </>
)}

{activePage === "My Tasks" && (
  <section className="welcome">
    <div>
      <h1>My Tasks 📋</h1>
      <p>Manage and organise all your tasks in one place.</p>
    </div>

    <button
      className="add-button"
      onClick={() => {
        setEditingTask(null);
        setNewTask("");
        setNewPriority("Medium");
        setNewCategory("General");
        setNewDeadline("");
        setShowForm(true);
      }}
    >
      + Add New Task
    </button>
  </section>
)}
{activePage === "Dashboard" && (
  <section className="stats">

  </section>
)}

{activePage === "My Tasks" && showForm && (
  <form className="task-form" onSubmit={saveTask}>
    <input
      value={newTask}
      onChange={e => setNewTask(e.target.value)}
      placeholder="Enter your task..."
    />

    <select value={newCategory} onChange={e => setNewCategory(e.target.value)}>
      <option value="General">General</option>
      <option value="Work">Work</option>
      <option value="Design">Design</option>
      <option value="Meeting">Meeting</option>
      <option value="Personal">Personal</option>
      <option value="Study">Study</option>
    </select>

    <input
      type="date"
      value={newDeadline}
      onChange={e => setNewDeadline(e.target.value)}
    />

    <select value={newPriority} onChange={e => setNewPriority(e.target.value)}>
      <option value="High">High Priority</option>
      <option value="Medium">Medium Priority</option>
      <option value="Low">Low Priority</option>
    </select>

    <button type="submit">Save Task</button>

    <button
      type="button"
      className="cancel-button"
      onClick={() => {
        setShowForm(false);
        setEditingTask(null);
        setNewTask("");
        setNewPriority("Medium");
        setNewCategory("General");
        setNewDeadline("");
      }}
    >
      Cancel
    </button>
  </form>
)}


{activePage === "Calendar" && (
  <section className="tasks-section">
    <div className="section-heading">
      <div>
        <h2>Task Calendar</h2>
        <p>View your tasks and their deadlines.</p>
      </div>
    </div>

    <div className="upcoming-list">
      {tasks
        .filter(task => task.deadline)
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
        .map(task => (
          <div className="upcoming-task" key={task.id}>
            <div>
              <h3>{task.title}</h3>
              <small>{task.category}</small>
            </div>

            <div className="deadline-info">
              <span>{task.done ? "Completed" : "Pending"}</span>
              <small>
                {new Date(task.deadline).toLocaleDateString()}
              </small>
            </div>
          </div>
        ))}
    </div>
  </section>
)}



{activePage === "Settings" && (
  <div className="settings-page">

    <div className="settings-heading">
      <h2>Account Settings</h2>
      <p>Manage your profile and application preferences.</p>
    </div>

    <section className="settings-card">
      <div className="settings-card-heading">
        <h3>Profile Information</h3>
        <p>Update your personal account details.</p>
      </div>

      <form
        className="profile-form"
        onSubmit={async (e) => {
          e.preventDefault();

          try {
            const userId = session?.user?.id;

            if (!userId) {
              throw new Error("Please log in first.");
            }

            const { error } = await supabase
              .from("profiles")
              .update({ full_name: userName })
              .eq("id", userId);

            if (error) throw error;

            alert("Profile updated successfully!");
          } catch (error) {
            alert(error.message);
          }
        }}
      >
        <div className="profile-details">
          <div className="settings-avatar">
            {profilePicture ? (
              <img src={profilePicture} alt="Profile" />
            ) : (
              <span>
                {userName
                  ? userName.charAt(0).toUpperCase()
                  : "U"}
              </span>
            )}
          </div>

          <div className="profile-text">
            <h3>{userName || "Your Name"}</h3>
            <p>{userEmail || "Your Email"}</p>

            <label htmlFor="profile-picture">
              Upload Profile Picture
            </label>

            <input
              id="profile-picture"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={async (e) => {
                const file = e.target.files?.[0];

                if (!file) return;

                if (file.size > 2 * 1024 * 1024) {
                  alert("Please choose an image smaller than 2MB.");
                  e.target.value = "";
                  return;
                }

                if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
                  alert("Please choose a JPG, PNG or WEBP image.");
                  e.target.value = "";
                  return;
                }

                try {
                  const userId = session?.user?.id;

                  if (!userId) {
                    throw new Error("Please log in first.");
                  }

                  const extension = file.name.split(".").pop().toLowerCase();
                  const filePath = `${userId}/${Date.now()}.${extension}`;

                  const { error: uploadError } = await supabase.storage
                    .from("avatars")
                    .upload(filePath, file, {
                      contentType: file.type
                    });

                  if (uploadError) throw uploadError;

                  const { data } = supabase.storage
                    .from("avatars")
                    .getPublicUrl(filePath);

                  const { error: profileError } = await supabase
                    .from("profiles")
                    .update({ avatar_url: data.publicUrl })
                    .eq("id", userId);

                  if (profileError) throw profileError;

                  setProfilePicture(data.publicUrl);

                  alert("Profile picture uploaded successfully!");
                } catch (error) {
                  alert(error.message);
                }
              }}
            />
          </div>
        </div>

        <div className="settings-info">
          <div>
            <label>Full Name</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div>
            <label>Email Address</label>
            <input
              type="email"
              value={userEmail}
              readOnly
            />
          </div>
        </div>

        <button type="submit" className="add-button">
          Save Profile
        </button>
      </form>
    </section>

    <section className="settings-card">
      <div className="settings-card-heading">
        <h3>Appearance</h3>
        <p>Customize how TaskFlow looks.</p>
      </div>

      <div className="settings-option">
        <div>
          <strong>{isDarkMode ? "Dark Mode" : "Light Mode"}</strong>
          <p>
            Currently using {isDarkMode ? "dark mode" : "light mode"}.
          </p>
        </div>

        <button
          className="theme-toggle"
          onClick={() => setIsDarkMode(!isDarkMode)}
          title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          type="button"
        >
          {isDarkMode ? "☀️" : "🌙"}
        </button>
      </div>
    </section>

    <section className="settings-card">
      <div className="settings-card-heading">
        <h3>Application Information</h3>
        <p>Details about your TaskFlow application.</p>
      </div>

      <div className="settings-info">
        <div>
          <small>Application Name</small>
          <strong>TaskFlow</strong>
        </div>

        <div>
          <small>Version</small>
          <strong>1.0.0</strong>
        </div>
      </div>
    </section>

  </div>
)}



    
{(activePage === "Dashboard" || activePage === "My Tasks") && (
  <section className="tasks-section" id="recent-tasks">

    <div className="section-heading">
      <div>
        <h2>{activePage === "My Tasks" ? "All Tasks" : "Recent Tasks"}</h2>
<p>
  {activePage === "My Tasks"
    ? "View and manage all your tasks."
    : "Keep track of what needs to get done."}
</p>
    </div>
  </div>

    <div className="task-controls">

  <div className="task-filters">
    <button
      className={taskFilter === "All" ? "active" : ""}
      onClick={() => setTaskFilter("All")}
    >
      All Tasks
    </button>

    <button
      className={taskFilter === "Pending" ? "active" : ""}
      onClick={() => setTaskFilter("Pending")}
    >
      Pending
    </button>

    <button
      className={taskFilter === "Completed" ? "active" : ""}
      onClick={() => setTaskFilter("Completed")}
    >
      Completed
    </button>
  </div>

      <input
        className="search-input"
        placeholder="Search tasks..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
    </div>

    <div className="task-list">
      {filteredTasks.map(task => (
        <div className="task-row" key={task.id}>
          <input
            type="checkbox"
            checked={task.done}
            onChange={() => toggleTask(task.id)}
          />

          <div className="task-details">
            <strong className={task.done ? "completed-task" : ""}>
              {task.title}
            </strong>
            <small>{task.category}</small>
          </div>

          <span className={`priority-badge ${(task.priority || "Medium").toLowerCase()}`}>
            {task.priority || "Medium"}
          </span>

          <span className={task.done ? "status done" : "status pending"}>
            {task.done ? "Completed" : "In Progress"}
          </span>

          <button
            className="edit-button"
            onClick={() => {
              setEditingTask(task);
              setNewTask(task.title);
              setNewPriority(task.priority || "Medium");
              setNewCategory(task.category || "General");
              setNewDeadline(task.deadline || "");
              setShowForm(true);
            }}
          >
            Edit
          </button>

         <button
  className="delete-button"
  onClick={() => deleteTask(task.id)}
  aria-label="Delete task"
>
  Cancel
</button>
        </div>
      ))}

      {filteredTasks.length === 0 && (
        <p className="empty-message">No tasks found.</p>
      )}
    </div>

  </section>
)}


        <footer>
          © 2026 TaskFlow. Stay organized, stay productive.
        </footer>

      </main>
    </div>
  );
}

export default App;
