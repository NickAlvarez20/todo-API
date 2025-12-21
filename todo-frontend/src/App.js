import { useState, useEffect } from "react";

function App() {
  // useState Variables
  const [todos, setTodos] = useState([]); // for todos list
  const [newTitle, setNewTitle] = useState(""); // for input field
  const [celebratingId, setCelebratingId] = useState(null); // Tracks which todo is being celebrated
  const [showCelebration, setShowCelebration] = useState(false);

  // useEffect variables
  useEffect(() => {
    fetch("/todos")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        setTodos(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.error("Error fetching todos:", error);
        setTodos([]);
      });
  }, []);

  // handleSubmit function
  const handleSubmit = async (e) => {
    e.preventDefault(); // prevent page reload

    if (newTitle.trim() === "") return; //don't add empty

    const response = await fetch("/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle }),
    });

    if (response.ok) {
      const newTodo = await response.json();
      setTodos([...todos, newTodo]); // <- Instant UI update!
      setNewTitle(""); // clears input
    } else {
      console.error("Failed to add todo");
    }
  };

  // handleDelete function
  const handleDelete = async (id) => {
    // Trigger celebration animation
    setCelebratingId(id);
    setShowCelebration(true);

    const response = await fetch(`/todos/${id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== id));

      // Hide celebration after animation
      setTimeout(() => {
        setShowCelebration(false);
        setCelebratingId(null);
      }, 2000); // Matches animation duration
    } else {
      console.error("Failed to delete todo:", id);
      setShowCelebration(false);
      setCelebratingId(null);
    }
  };
  return (
    <div
      style={{
        width: "100vw",
        minHeight: "100vh",
        margin: 0,
        padding: 0,
        boxSizing: "border-box",
        fontFamily: "'Segoe UI', Roboto, sans-serif",
        color: "#f0f0f0",
        backgroundColor: "#000",
        paddingBottom: "env(safe-area-inset-bottom, 60px)",
      }}
    >
      {/* Main Christmas scene background */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          pointerEvents: "none",
          zIndex: 1,
          overflow: "hidden",
          backgroundColor: "#000",
        }}
      >
        <div
          style={{
            width: "100vw",
            height: "120vh",
            maxWidth: "100vw",
            maxHeight: "100vh",
            backgroundImage:
              "url('/ChristmasBackgroundTheme-GrandHolyPalace.jpg')",
            backgroundSize: "100% 1168px",
            backgroundPosition: "center top",
            backgroundRepeat: "no-repeat",
          }}
        />
      </div>

      {/* Medium-intensity snowstorm overlay */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "radial-gradient(circle, white 1.5px, transparent 2px)",
          backgroundSize: "50px 50px",
          animation: "snowFall 18s linear infinite",
          opacity: 0.85,
          pointerEvents: "none",
          zIndex: 2,
        }}
      />

      {/* Scrollable content container with generous padding */}
      <div
        style={{
          position: "relative",
          zIndex: 3,
          width: "100%",
          minHeight: "100vh",
          padding: "20px 20px 120px 20px", // Extra bottom padding for smooth scrolling
          boxSizing: "border-box",
        }}
      >
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h1
            style={{
              textAlign: "center",
              color: "#ffd700",
              marginBottom: "40px",
              fontSize: "3rem",
              fontWeight: "700",
              textShadow: "0 0 15px rgba(255,215,0,0.6)",
            }}
          >
            🎄 My Christmas Todo List 🎄
          </h1>

          {/* Input form card */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              backdropFilter: "blur(12px)",
              borderRadius: "16px",
              padding: "30px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              border: "1px solid rgba(255,255,255,0.2)",
              marginBottom: "40px",
            }}
          >
            <form
              onSubmit={handleSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "15px",
              }}
              className="add-form"
            >
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Add a new Christmas task... 🎁"
                style={{
                  padding: "16px 20px",
                  fontSize: "1.2rem",
                  background: "rgba(255, 255, 255, 0.2)",
                  border: "2px solid rgba(255,255,255,0.4)",
                  borderRadius: "12px",
                  color: "white",
                  outline: "none",
                }}
              />
              <button
                type="submit"
                style={{
                  padding: "16px",
                  fontSize: "1.2rem",
                  background: "#228b22",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Add Todo 🎅
              </button>
            </form>
          </div>

          <p
            style={{
              textAlign: "center",
              fontSize: "1.4rem",
              marginBottom: "30px",
              color: "#ffd700",
            }}
          >
            {todos.length === 0
              ? "No tasks yet — let's get ready for Christmas! ❄️"
              : `You have ${todos.length} ${
                  todos.length === 1 ? "task" : "tasks"
                } to complete`}
          </p>

          <ul style={{ listStyle: "none", padding: 0 }}>
            {todos.map((todo) => (
              <li
                key={todo.id}
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  backdropFilter: "blur(8px)",
                  marginBottom: "30px", // Increased margin below each todo for breathing room
                  padding: "20px",
                  borderRadius: "14px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  opacity: celebratingId === todo.id ? 0 : 1,
                  transform:
                    celebratingId === todo.id ? "scale(1.3)" : "scale(1)",
                  transition:
                    "opacity 0.6s ease-out, transform 0.6s cubic-bezier(0.68, -0.55, 0.27, 1.55)",
                }}
                className="todo-item"
              >
                <span style={{ fontSize: "1.3rem", color: "white" }}>
                  {todo.title}
                </span>
                <button
                  onClick={() => handleDelete(todo.id)}
                  style={{
                    alignSelf: "flex-end",
                    padding: "10px 20px",
                    background: "#8b0000",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  Complete! ✨
                </button>
              </li>
            ))}
          </ul>

          {todos.length === 0 && (
            <p
              style={{
                textAlign: "center",
                color: "#ffd700",
                fontStyle: "italic",
                fontSize: "1.3rem",
                marginTop: "60px",
              }}
            >
              Ho ho ho! Time to start your Christmas preparations! 🎁
            </p>
          )}

          {/* Celebration overlay */}
          {showCelebration && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                background: "rgba(0, 0, 0, 0.7)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 100,
                animation: "fadeIn 0.5s ease-out",
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  color: "#ffd700",
                  animation: "popUp 1.5s ease-out",
                }}
              >
                <h2
                  style={{
                    fontSize: "4rem",
                    margin: 0,
                    textShadow: "0 0 30px gold",
                  }}
                >
                  Task Complete! 🎉
                </h2>
                <p
                  style={{ fontSize: "2rem", margin: "20px 0", color: "white" }}
                >
                  Great job! 🎄✨
                </p>
                <div
                  style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    top: 0,
                    left: 0,
                    pointerEvents: "none",
                  }}
                >
                  {[...Array(30)].map((_, i) => (
                    <div
                      key={i}
                      style={{
                        position: "absolute",
                        width: "10px",
                        height: "10px",
                        background: [
                          "#ff0000",
                          "#00ff00",
                          "#ffd700",
                          "#ff69b4",
                        ][Math.floor(Math.random() * 4)],
                        borderRadius: "50%",
                        left: `${Math.random() * 100}vw`,
                        top: "-20px",
                        animation: `confettiFall ${
                          2 + Math.random() * 2
                        }s linear forwards`,
                        animationDelay: `${Math.random() * 0.5}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Festive Footer */}
        <footer
          style={{
            marginTop: "80px",
            padding: "20px",
            textAlign: "center",
            color: "#ffd700",
            fontSize: "1rem",
            borderTop: "1px solid rgba(255,215,0,0.3)",
            background: "rgba(0,0,0,0.3)",
            backdropFilter: "blur(8px)",
          }}
        >
          <p style={{ margin: "10px 0" }}>
            Made with ❤️ and holiday magic · {new Date().getFullYear()}
          </p>
          <p style={{ margin: "5px 0", fontSize: "0.9rem", opacity: 0.8 }}>
            Merry Christmas & Happy Holidays! 🎅✨
          </p>
        </footer>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes snowFall {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 0 2000px;
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes popUp {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes confettiFall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
          }
        }
        /* Responsive */
        .add-form {
          flex-direction: column;
        }
        .todo-item {
          flex-direction: column;
          align-items: flex-start;
        }
        @media (max-width: 768px) {
          [style*="padding: 20px 20px 120px 20px"] {
            padding-bottom: 160px !important;
          }
          h2[style*='fontSize: "4rem"'] {
            font-size: 3rem !important;
          }
          p[style*='fontSize: "2rem"'] {
            font-size: 1.6rem !important;
          }
          h1 {
            font-size: 2.2rem !important;
            margin-bottom: 30px;
          }
          .add-form > input,
          .add-form > button {
            font-size: 1.1rem;
            padding: 14px 18px;
          }
          .todo-item > span {
            font-size: 1.2rem;
          }
        }
        @media (min-width: 1024px) {
          h1 {
            font-size: 3.5rem;
          }
        }
      `}</style>
    </div>
  );
}

export default App;
