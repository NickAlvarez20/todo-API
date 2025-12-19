package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
)

func helloHandler(w http.ResponseWriter, r *http.Request) {
	// Log the incoming request
	log.Printf("Request received: %s %s\n", r.Method, r.URL.Path)

	// Write the response header and body
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, "Hello, World!")
}

type Todo struct {
	ID    int    `json:"id"`
	Title string `json:"title"`
	Done  bool   `json:"done"`
}

var todos []Todo   // Slice to hold all todos
var nextID int = 1 // A counter for the next available ID (start at 1)
var mu sync.Mutex  // A mutex to make it safe when multiple requests try to read/write the todos at the same time (Add sync to import)

func todosHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	switch r.Method {
	case http.MethodGet:
		if r.URL.Path == "/todos" || r.URL.Path == "/todos/" {
			mu.Lock()
			defer mu.Unlock()
			json.NewEncoder(w).Encode(todos)
		} else {
			fmt.Fprintf(w, "Get single todo - path: %s", r.URL.Path)
		}
	case http.MethodPost:
		// Only allow POST on the collection endpoint (/todos or /todos/)
		// Guard clause for early returns if URL path is incorrect during the POST request
		if r.URL.Path != "/todos" && r.URL.Path != "/todos/" {
			http.Error(w, "Method not allowed on this path", http.StatusMethodNotAllowed)
			return
		}

		// Struct to hold the incoming JSON data
		var input struct {
			Title string `json:"title"`
		}

		// Decode the JSON body using encoding/json package
		if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
			http.Error(w, "Invalid JSON", http.StatusBadRequest)
			return
		}

		// Validate that title is provided
		if input.Title == "" {
			http.Error(w, "Title is required", http.StatusBadRequest)
			return
		}

		// Create and append the new todo (thread-safe)
		mu.Lock()
		newTodo := Todo{
			ID:    nextID,
			Title: input.Title,
			Done:  false,
		}
		todos = append(todos, newTodo)
		nextID++
		mu.Unlock()

		// Respond with 201 Created and the new todo
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(newTodo)

	case http.MethodDelete:
		// handle DELETE here
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}

}

func main() {
	// Priority for testing
	http.HandleFunc("/todos", todosHandler)
	http.HandleFunc("/todos/", todosHandler)
	// Register the handler function for the "/hello" path
	http.HandleFunc("/", helloHandler)

	// Log the server start message
	log.Println("Server starting on port 8080...")

	// Start the http server.
	// Passing nul as the second argument uses the default ServeMux.
	if err := http.ListenAndServe(":8080", nil); err != nil {
		// log any errors that prevent the server from starting
		log.Fatalf("Could not start server: %v\n", err)
	}

}
