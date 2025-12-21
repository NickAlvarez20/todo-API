package handler

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"
	"sync"
)

type Todo struct {
	ID    int    `json:"id"`
	Title string `json:"title"`
	Done  bool   `json:"done"`
}

var todos = []Todo{}
var nextID = 1
var mu sync.Mutex

// Vercel calls this function
func Handler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Optional CORS (not needed on same domain, but safe)
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	log.Printf("Request: %s %s", r.Method, r.URL.Path)

	// Strip leading /api if present (Vercel adds it sometimes)
	path := strings.TrimPrefix(r.URL.Path, "/api")

	switch r.Method {
	case http.MethodGet:
		if path == "/todos" || path == "/todos/" {
			mu.Lock()
			defer mu.Unlock()
			json.NewEncoder(w).Encode(todos)
			return
		}

		// Single todo
		idStr := strings.TrimPrefix(path, "/todos/")
		idStr = strings.TrimSuffix(idStr, "/")
		id, err := strconv.Atoi(idStr)
		if err != nil || id < 1 {
			http.Error(w, "Invalid ID", http.StatusBadRequest)
			return
		}

		mu.Lock()
		for _, t := range todos {
			if t.ID == id {
				mu.Unlock()
				json.NewEncoder(w).Encode(t)
				return
			}
		}
		mu.Unlock()
		http.Error(w, "Not found", http.StatusNotFound)

	case http.MethodPost:
		if path != "/todos" && path != "/todos/" {
			http.Error(w, "Bad path", http.StatusBadRequest)
			return
		}

		var input struct{ Title string `json:"title"` }
		if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
			http.Error(w, "Invalid JSON", http.StatusBadRequest)
			return
		}
		if input.Title == "" {
			http.Error(w, "Title required", http.StatusBadRequest)
			return
		}

		mu.Lock()
		newTodo := Todo{ID: nextID, Title: input.Title, Done: false}
		todos = append(todos, newTodo)
		nextID++
		mu.Unlock()

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(newTodo)

	case http.MethodDelete:
		idStr := strings.TrimPrefix(path, "/todos/")
		idStr = strings.TrimSuffix(idStr, "/")
		id, err := strconv.Atoi(idStr)
		if err != nil || id < 1 {
			http.Error(w, "Invalid ID", http.StatusBadRequest)
			return
		}

		mu.Lock()
		for i, t := range todos {
			if t.ID == id {
				todos = append(todos[:i], todos[i+1:]...)
				mu.Unlock()
				w.WriteHeader(http.StatusNoContent)
				return
			}
		}
		mu.Unlock()
		http.Error(w, "Not found", http.StatusNotFound)

	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}