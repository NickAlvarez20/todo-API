package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
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

var todos = []Todo{}   // Slice to hold all todos
var nextID int = 1 // A counter for the next available ID (start at 1)
var mu sync.Mutex  // A mutex to make it safe when multiple requests try to read/write the todos at the same time (Add sync to import)

func todosHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	// Log every request to /todos
    log.Printf("Request: %s %s from %s", r.Method, r.URL.Path, r.RemoteAddr)
	

	// Handle preflight OPTIONS request
	if r.Method == http.MethodOptions {
    w.WriteHeader(http.StatusOK)
    return
}

	switch r.Method {
	case http.MethodGet:
		if r.URL.Path == "/todos" || r.URL.Path == "/todos/" {
			mu.Lock()
			defer mu.Unlock()
			json.NewEncoder(w).Encode(todos)
		} else {
			// Extract the id from the path like /todos/123
			idStr := strings.TrimPrefix(r.URL.Path, "/todos/")
			// if trailing slash remove it too
			idStr = strings.TrimSuffix(idStr, "/")

			// Convert string to int
			id, err := strconv.Atoi(idStr)
			if err != nil || id < 1 {
				http.Error(w, "Invalid todo ID", http.StatusBadRequest)
				return
			}
			// Search for the todo
			mu.Lock()
			var found *Todo
			for _, t := range todos {
				if t.ID == id {
					found = &t
					break
				}
			}
			mu.Unlock()

			if found == nil {
				http.Error(w, "Todo not found", http.StatusNotFound)
				return
			}

			// Return the found todo as JSOn
			json.NewEncoder(w).Encode(found)
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
		// Extract the id from the path like /todos/123 like previously
		idStr := strings.TrimPrefix(r.URL.Path, "/todos/")
		idStr = strings.TrimSuffix(idStr, "/")

		id, err := strconv.Atoi(idStr)
		if err != nil || id < 1 {
			http.Error(w, "Invalid todo ID", http.StatusBadRequest)
			return
		}

		// Delete the todo (thread-safe)
		mu.Lock()
		var deleted bool
		for i, t := range todos {
			if t.ID == id {
				// Remove the element by appending slices
				todos = append(todos[:i], todos[i+1:]...)
				deleted = true
				break
			}
		}
		mu.Unlock()

		if !deleted {
			http.Error(w, "Todo not found", http.StatusNotFound)
			return
		}

		w.WriteHeader(http.StatusNoContent)
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
