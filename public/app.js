document.addEventListener('DOMContentLoaded', function() {
  const tabButtons = document.querySelectorAll('.tab-btn')
  const tabContents = document.querySelectorAll('.tab-content')
  const addMovieBtn = document.getElementById('add-movie-btn')
  const addMovieModal = document.getElementById('add-movie-modal')
  const modalCloseBtns = document.querySelectorAll('.modal-close')
  const cancelBtns = document.querySelectorAll('.modal-footer .btn-secondary')
  const saveMovieBtn = document.getElementById('save-movie-btn')
  const movieForm = document.getElementById('movie-form')
  const movieIdInput = document.getElementById('movie-id')
  const movieTitleInput = document.getElementById('movie-title')
  const movieDescriptionInput = document.getElementById('movie-description')
  const movieGenreInput = document.getElementById('movie-genre')
  const movieDurationInput = document.getElementById('movie-duration')
  const movieRatingInput = document.getElementById('movie-rating')
  const movieReleaseDateInput = document.getElementById('movie-release-date')
  const moviePosterInput = document.getElementById('movie-poster')
  const movieTableBody = document.querySelector('#movies-tab tbody')
  const cinemaTableBody = document.querySelector('#cinemas-tab tbody')
  const bookingTableBody = document.querySelector('#bookings-tab tbody')
  const notificationContainer = document.querySelector('.notification-container')
  const totalCinemasEl = document.querySelector('.summary-card.cinemas .summary-card-value')
  const totalMoviesEl = document.querySelector('.summary-card.movies .summary-card-value')
  const totalBookingsEl = document.querySelector('.summary-card.bookings .summary-card-value')

  const API_BASE_URL = '/api'
  const MOVIES_API = `${API_BASE_URL}/movies`
  const CINEMAS_API = `${API_BASE_URL}/cinemas`
  const BOOKINGS_API = `${API_BASE_URL}/bookings`
  
  let movies = []
  let cinemas = []
  let bookings = []
  let isEditMode = false
  let currentMovieId = null

  tabButtons.forEach(button => {
      button.addEventListener('click', () => {
          const tab = button.getAttribute('data-tab')
          
          tabButtons.forEach(btn => btn.classList.remove('active'))
          button.classList.add('active')
          
          tabContents.forEach(content => content.classList.remove('active'))
          document.getElementById(`${tab}-tab`).classList.add('active')
      })
  })

  function openModal(modalId) {
      const modal = document.getElementById(modalId)
      if (modal) {
          modal.classList.add('active')
      }
  }

  function closeAllModals() {
      const allModals = document.querySelectorAll('.modal-overlay')
      allModals.forEach(modal => {
          modal.classList.remove('active')
      })
  }

  if (addMovieBtn) {
      addMovieBtn.addEventListener('click', () => {
          if (movieForm) movieForm.reset()
          isEditMode = false
          currentMovieId = null
          document.querySelector('#add-movie-modal .modal-title').innerHTML = '<i class="fas fa-film"></i> Add New Movie'
          openModal('add-movie-modal')
      })
  }

  modalCloseBtns.forEach(btn => {
      btn.addEventListener('click', closeAllModals)
  })

  cancelBtns.forEach(btn => {
      btn.addEventListener('click', closeAllModals)
  })

  document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay')) {
          closeAllModals()
      }
  })

  if (saveMovieBtn) {
      saveMovieBtn.addEventListener('click', handleSaveMovie)
  }

  async function fetchMovies() {
      try {
          const response = await fetch(MOVIES_API)
          if (!response.ok) {
              const errorData = await response.json().catch(() => ({}))
              console.error('Server response:', response.status, errorData)
              throw new Error(`Failed to fetch movies: ${response.status} ${response.statusText}`)
          }
          movies = await response.json()
          renderMovies()
          updateSummary()
      } catch (error) {
          console.error('Error fetching movies:', error)
          showNotification('Failed to load movies: ' + error.message, 'error')
          renderMovies()
      }
  }

  async function fetchCinemas() {
      try {
          const response = await fetch(CINEMAS_API)
          if (!response.ok) {
              const errorData = await response.json().catch(() => ({}))
              console.error('Server response:', response.status, errorData)
              throw new Error(`Failed to fetch cinemas: ${response.status} ${response.statusText}`)
          }
          cinemas = await response.json()
          renderCinemas()
          updateSummary()
      } catch (error) {
          console.error('Error fetching cinemas:', error)
          showNotification('Failed to load cinemas: ' + error.message, 'error')
          renderCinemas()
      }
  }

  async function fetchBookings() {
      try {
          const response = await fetch(BOOKINGS_API)
          if (!response.ok) {
              const errorData = await response.json().catch(() => ({}))
              console.error('Server response:', response.status, errorData)
              throw new Error(`Failed to fetch bookings: ${response.status} ${response.statusText}`)
          }
          bookings = await response.json()
          renderBookings()
          updateSummary()
      } catch (error) {
          console.error('Error fetching bookings:', error)
          showNotification('Failed to load bookings: ' + error.message, 'error')
          renderBookings()
      }
  }

  async function createMovie(movieData) {
      try {
          const formData = new FormData()
          
          Object.keys(movieData).forEach(key => {
              formData.append(key, movieData[key])
          })
          
          if (moviePosterInput.files.length > 0) {
              formData.append('poster', moviePosterInput.files[0])
          }
          
          const response = await fetch(MOVIES_API, {
              method: 'POST',
              body: formData 
          })
          
          if (!response.ok) throw new Error('Failed to create movie')
          
          const newMovie = await response.json()
          fetchMovies()
          showNotification('Movie created successfully', 'success')
      } catch (error) {
          console.error('Error creating movie:', error)
          showNotification('Failed to create movie', 'error')
      }
  }

  async function updateMovie(id, movieData) {
    try {
      console.log(`Updating movie ${id} with data:`, movieData)
      const formData = new FormData()
      
      Object.keys(movieData).forEach(key => {
        console.log(`Adding to form: ${key} = ${movieData[key]}`)
        formData.append(key, movieData[key])
      })
      
      if (moviePosterInput.files.length > 0) {
        console.log("Adding poster file:", moviePosterInput.files[0].name, moviePosterInput.files[0].type, moviePosterInput.files[0].size)
        formData.append('poster', moviePosterInput.files[0])
      }
      
      console.log(`Sending request to: ${MOVIES_API}/${id}`)
      
      try {
        const checkResponse = await fetch('/uploads-check', { method: 'GET' })
        console.log('Uploads directory check response:', checkResponse.status, await checkResponse.text())
      } catch (e) {
        console.log('Uploads directory check failed:', e)
      }
      
      const response = await fetch(`${MOVIES_API}/${id}`, {
        method: 'PUT',
        body: formData
      })
      
      console.log(`Response status: ${response.status}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error response:', errorText)
        throw new Error(`Failed to update movie: Status ${response.status}`)
      }
      
      const updatedMovie = await response.json()
      console.log('Movie updated successfully:', updatedMovie)
      
      fetchMovies()
      showNotification('Movie updated successfully', 'success')
    } catch (error) {
      console.error('Error updating movie:', error)
      showNotification(`Failed to update movie: ${error.message}`, 'error')
    }
  }

  async function deleteMovie(id) {
    try {
      const response = await fetch(`${MOVIES_API}/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Server response (${response.status}):`, errorText)
        
        if (response.status === 500 && errorText.includes('foreign key constraint')) {
          throw new Error('Cannot delete movie because it has related bookings or other records')
        } else {
          throw new Error(`Failed to delete movie: ${response.status}`)
        }
      }
      
      fetchMovies()
      showNotification('Movie deleted successfully', 'success')
    } catch (error) {
      console.error('Error deleting movie:', error)
      showNotification(`Failed to delete movie: ${error.message}`, 'error')
    }
  }

  function handleSaveMovie() {
      const movieData = {
          title: movieTitleInput.value,
          description: movieDescriptionInput.value,
          genre: movieGenreInput.value,
          duration: parseInt(movieDurationInput.value),
          rating: movieRatingInput.value,
          release_date: movieReleaseDateInput.value
      }
      
      if (!movieData.title || !movieData.genre || !movieData.duration || !movieData.rating || !movieData.release_date) {
          showNotification('Please fill in all required fields', 'error')
          return
      }
      
      if (isEditMode && currentMovieId) {
          updateMovie(currentMovieId, movieData)
      } else {
          createMovie(movieData)
      }
      
      closeAllModals()
  }

  function renderMovies() {
      if (!movieTableBody) return
  
      movieTableBody.innerHTML = ''
  
      if (movies.length === 0) {
        const emptyRow = document.createElement('tr')
        emptyRow.innerHTML = `
          <td colspan="7">
              <div class="empty-state">
                  <i class="fas fa-film"></i>
                  <h3>No movies available</h3>
                  <p>Add a new movie to get started</p>
              </div>
          </td>
      `
        movieTableBody.appendChild(emptyRow)
        return
    }
  
      movies.forEach(movie => {
      const row = document.createElement('tr')
      row.setAttribute('data-id', movie.movie_id)
      
      const releaseDate = new Date(movie.release_date)
      const formattedDate = releaseDate.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
      })
      
      const defaultPoster = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNTAiIGhlaWdodD0iMjI1IiBmaWxsPSIjZGRkZGRkIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjIyNSIgZmlsbD0iI2VlZWVlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ibW9ub3NwYWNlIiBmb250LXNpemU9IjE2cHgiIGZpbGw9IiM5OTk5OTkiPk5vIFBvc3RlcjwvdGV4dD48L3N2Zz4='
      const posterUrl = movie.poster || defaultPoster

      row.innerHTML = `
          <td>
              <img src="${posterUrl}" alt="${movie.title}" class="movie-poster">
          </td>
          <td>${movie.title}</td>
          <td>${movie.genre || 'N/A'}</td>
          <td>${movie.duration || 0} min</td>
          <td><span class="badge badge-${(movie.rating || 'PG').toLowerCase().replace('-', '')}">${movie.rating || 'PG'}</span></td>
          <td>${formattedDate}</td>
          <td>
              <div class="table-actions">
                  <button class="btn btn-sm btn-outline-primary edit-movie" title="Edit">
                      <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger delete-movie" title="Delete">
                      <i class="fas fa-trash"></i>
                  </button>
              </div>
          </td>
      `
      
      movieTableBody.appendChild(row)
  })  
  
  attachMovieActionListeners()
}
  
  function renderCinemas() {
      if (!cinemaTableBody) return
      
      cinemaTableBody.innerHTML = ''
      
      if (cinemas.length === 0) {
          const emptyRow = document.createElement('tr')
          emptyRow.innerHTML = `
              <td colspan="5">
                  <div class="empty-state">
                      <i class="fas fa-building"></i>
                      <h3>No cinemas available</h3>
                      <p>Add a new cinema to get started</p>
                  </div>
              </td>
          `
          cinemaTableBody.appendChild(emptyRow)
          return
      }
      
      cinemas.forEach(cinema => {
          const row = document.createElement('tr')
          row.setAttribute('data-id', cinema.cinema_id)
          
          row.innerHTML = `
              <td>${cinema.name || 'N/A'}</td>
              <td>${cinema.city || 'N/A'}</td>
              <td>${cinema.address || 'N/A'}</td>
              <td>${cinema.contact_number || 'N/A'}</td>
              <td>
                  <div class="table-actions">
                      <button class="btn btn-sm btn-outline-primary edit-cinema" title="Edit">
                          <i class="fas fa-edit"></i>
                      </button>
                      <button class="btn btn-sm btn-outline-danger delete-cinema" title="Delete">
                          <i class="fas fa-trash"></i>
                      </button>
                  </div>
              </td>
          `
          
          cinemaTableBody.appendChild(row)
      })
      
      attachCinemaActionListeners()
  }
  
  function renderBookings() {
      if (!bookingTableBody) return
      
      bookingTableBody.innerHTML = ''
      
      if (bookings.length === 0) {
          const emptyRow = document.createElement('tr')
          emptyRow.innerHTML = `
              <td colspan="6">
                  <div class="empty-state">
                      <i class="fas fa-ticket-alt"></i>
                      <h3>No bookings available</h3>
                      <p>Bookings will appear here once created</p>
                  </div>
              </td>
          `
          bookingTableBody.appendChild(emptyRow)
          return
      }
      
      bookings.forEach(booking => {
          const row = document.createElement('tr')
          row.setAttribute('data-id', booking.booking_id)
          
          const bookingDate = new Date(booking.booking_date)
          const formattedDate = !isNaN(bookingDate) ? bookingDate.toLocaleString('en-US', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric',
              hour12: true
          }) : 'Invalid Date'
          
          row.innerHTML = `
              <td>${booking.username || 'N/A'}</td>
              <td>${booking.movie_title || 'N/A'}</td>
              <td>${formattedDate}</td>
              <td><span class="badge badge-${(booking.booking_status || 'pending').toLowerCase()}">${booking.booking_status || 'Pending'}</span></td>
              <td>${booking.promo_code || 'None'}</td>
              <td>
                  <div class="table-actions">
                      <button class="btn btn-sm btn-outline-primary edit-booking" title="Edit">
                          <i class="fas fa-edit"></i>
                      </button>
                      <button class="btn btn-sm btn-outline-danger delete-booking" title="Delete">
                          <i class="fas fa-trash"></i>
                      </button>
                  </div>
              </td>
          `
          
          bookingTableBody.appendChild(row)
      })
      
      attachBookingActionListeners()
  }

  function attachMovieActionListeners() {
      const editButtons = document.querySelectorAll('.edit-movie')
      const deleteButtons = document.querySelectorAll('.delete-movie')
      
      editButtons.forEach(button => {
          button.addEventListener('click', handleEditMovie)
      })
      
      deleteButtons.forEach(button => {
          button.addEventListener('click', handleDeleteMovie)
      })
  }
  
  function attachCinemaActionListeners() {
      const editButtons = document.querySelectorAll('.edit-cinema')
      const deleteButtons = document.querySelectorAll('.delete-cinema')
      
      editButtons.forEach(button => {
          button.addEventListener('click', handleEditCinema)
      })
      
      deleteButtons.forEach(button => {
          button.addEventListener('click', handleDeleteCinema)
      })
  }
  
  function attachBookingActionListeners() {
      const editButtons = document.querySelectorAll('.edit-booking')
      const deleteButtons = document.querySelectorAll('.delete-booking')
      
      editButtons.forEach(button => {
          button.addEventListener('click', handleEditBooking)
      })
      
      deleteButtons.forEach(button => {
          button.addEventListener('click', handleDeleteBooking)
      })
  }

  function handleEditMovie(e) {
      const row = e.target.closest('tr')
      const movieId = parseInt(row.getAttribute('data-id'))
      const movie = movies.find(m => m.movie_id === movieId)
      
      if (movie) {
          isEditMode = true
          currentMovieId = movieId
          
          movieIdInput.value = movie.movie_id
          movieTitleInput.value = movie.title || ''
          movieDescriptionInput.value = movie.description || ''
          movieGenreInput.value = movie.genre || ''
          movieDurationInput.value = movie.duration || ''
          movieRatingInput.value = movie.rating || ''
          
          const releaseDate = new Date(movie.release_date)
          const formattedDate = !isNaN(releaseDate) ? releaseDate.toISOString().split('T')[0] : ''
          movieReleaseDateInput.value = formattedDate
          
          document.querySelector('#add-movie-modal .modal-title').innerHTML = '<i class="fas fa-edit"></i> Edit Movie'
          
          openModal('add-movie-modal')
      }
  }
  
  function handleDeleteMovie(e) {
      const row = e.target.closest('tr')
      const movieId = parseInt(row.getAttribute('data-id'))
      const movie = movies.find(m => m.movie_id === movieId)
      
      if (movie && confirm(`Are you sure you want to delete "${movie.title}"?`)) {
          deleteMovie(movieId)
      }
  }
  
  function handleEditCinema(e) {
      const row = e.target.closest('tr')
      const cinemaId = parseInt(row.getAttribute('data-id'))
      
      showNotification('Cinema editing will be available in the next update', 'info')
  }
  
  function handleDeleteCinema(e) {
      const row = e.target.closest('tr')
      const cinemaId = parseInt(row.getAttribute('data-id'))
      const cinemaName = row.cells[0].textContent
      
      if (confirm(`Are you sure you want to delete "${cinemaName}"?`)) {
          showNotification('Cinema deletion will be available in the next update', 'info')
      }
  }
  
  function handleEditBooking(e) {
      const row = e.target.closest('tr')
      const bookingId = parseInt(row.getAttribute('data-id'))
      
      showNotification('Booking editing will be available in the next update', 'info')
  }
  
  function handleDeleteBooking(e) {
      const row = e.target.closest('tr')
      const bookingId = parseInt(row.getAttribute('data-id'))
      const userName = row.cells[0].textContent
      
      if (confirm(`Are you sure you want to delete booking for "${userName}"?`)) {
          showNotification('Booking deletion will be available in the next update', 'info')
      }
  }

  function updateSummary() {
      if (totalCinemasEl) totalCinemasEl.textContent = cinemas.length || 0
      if (totalMoviesEl) totalMoviesEl.textContent = movies.length || 0
      if (totalBookingsEl) totalBookingsEl.textContent = bookings.length || 0
  }

  function showNotification(message, type = 'success') {
      const notification = document.createElement('div')
      notification.className = `notification notification-${type}`
      
      notification.innerHTML = `
          <div class="notification-content">
              <span class="notification-icon">
                  <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'info' ? 'info-circle' : 'exclamation-circle'}"></i>
              </span>
              <span>${message}</span>
          </div>
          <button class="notification-close">&times;</button>
      `
      
      notificationContainer.appendChild(notification)
      
      const closeButton = notification.querySelector('.notification-close')
      closeButton.addEventListener('click', () => {
          notification.classList.add('fade-out')
          setTimeout(() => {
              notification.remove()
          }, 500)
      })
      
      setTimeout(() => {
          notification.classList.add('fade-out')
          setTimeout(() => {
              notification.remove()
          }, 500)
      }, 3000)
  }

  const searchInput = document.querySelector('.search-input input')
  const filterBtn = document.querySelector('.filter-btn')
  let filterDropdownContent = null
  
  function createFilterDropdown() {
    if (!filterDropdownContent) {
      filterDropdownContent = document.createElement('div')
      filterDropdownContent.className = 'filter-dropdown-content'
      filterDropdownContent.innerHTML = `
        <div class="filter-group">
          <h4>Content Type</h4>
          <div class="filter-options">
            <label class="filter-option">
              <input type="checkbox" data-filter="type" value="movie" checked> Movies
            </label>
            <label class="filter-option">
              <input type="checkbox" data-filter="type" value="cinema" checked> Cinemas
            </label>
            <label class="filter-option">
              <input type="checkbox" data-filter="type" value="booking" checked> Bookings
            </label>
          </div>
        </div>
        <div class="filter-group">
          <h4>Movie Genre</h4>
          <div class="filter-options">
            <label class="filter-option">
              <input type="checkbox" data-filter="genre" value="Action" checked> Action
            </label>
            <label class="filter-option">
              <input type="checkbox" data-filter="genre" value="Comedy" checked> Comedy
            </label>
            <label class="filter-option">
              <input type="checkbox" data-filter="genre" value="Drama" checked> Drama
            </label>
            <label class="filter-option">
              <input type="checkbox" data-filter="genre" value="Horror" checked> Horror
            </label>
          </div>
        </div>
        <div class="filter-actions">
          <button class="btn btn-sm btn-primary apply-filters">Apply Filters</button>
          <button class="btn btn-sm btn-secondary reset-filters">Reset</button>
        </div>
      `
      
      document.querySelector('.filter-dropdown').appendChild(filterDropdownContent)
    
      document.querySelector('.apply-filters').addEventListener('click', applyFilters)
      document.querySelector('.reset-filters').addEventListener('click', resetFilters)
      
      document.addEventListener('click', function(e) {
        if (!e.target.closest('.filter-dropdown') && filterDropdownContent.classList.contains('active')) {
          filterDropdownContent.classList.remove('active')
        }
      })
    }
  }
  
  if (filterBtn) {
    filterBtn.addEventListener('click', function(e) {
      e.stopPropagation()
      createFilterDropdown()
      filterDropdownContent.classList.toggle('active')
    })
  }
  
  if (searchInput) {
    searchInput.addEventListener('input', debounce(function() {
      const query = searchInput.value.trim().toLowerCase()
      performSearch(query)
    }, 300))
  }
  
  function debounce(func, wait) {
    let timeout
    return function() {
      const context = this
      const args = arguments
      clearTimeout(timeout)
      timeout = setTimeout(function() {
        func.apply(context, args)
      }, wait)
    }
  }
  
  function performSearch(query) {
    const activeFilters = getActiveFilters()
    
    if (query.length > 0) {
      showNotification(`Searching for "${query}"...`, 'info')
    }
    
    if (query.length === 0 && !hasActiveFilters(activeFilters)) {
      renderMovies()
      renderCinemas()
      renderBookings()
      return
    }
    
    if (activeFilters.type.includes('movie')) {
      const filteredMovies = movies.filter(movie => {
        const matchesQuery = query.length === 0 || 
          movie.title.toLowerCase().includes(query) ||
          (movie.description && movie.description.toLowerCase().includes(query)) ||
          (movie.genre && movie.genre.toLowerCase().includes(query))
        
        const matchesGenre = activeFilters.genre.length === 0 || 
          activeFilters.genre.includes(movie.genre?.toLowerCase())
        
        return matchesQuery && matchesGenre
      })
      
      renderFilteredMovies(filteredMovies)
    } else {
      renderEmptyMoviesFilter()
    }
    
    if (activeFilters.type.includes('cinema')) {
      const filteredCinemas = cinemas.filter(cinema => {
        return query.length === 0 || 
          cinema.name.toLowerCase().includes(query) ||
          (cinema.city && cinema.city.toLowerCase().includes(query)) ||
          (cinema.address && cinema.address.toLowerCase().includes(query))
      })
      
      renderFilteredCinemas(filteredCinemas)
    } else {
      renderEmptyCinemasFilter()
    }
    
    if (activeFilters.type.includes('booking')) {
      const filteredBookings = bookings.filter(booking => {
        return query.length === 0 || 
          (booking.username && booking.username.toLowerCase().includes(query)) ||
          (booking.movie_title && booking.movie_title.toLowerCase().includes(query)) ||
          (booking.booking_status && booking.booking_status.toLowerCase().includes(query))
      })
      
      renderFilteredBookings(filteredBookings)
    } else {
      renderEmptyBookingsFilter()
    }
  }
  
  function getActiveFilters() {
    const filters = {
      type: [],
      genre: []
    }
    
    if (!filterDropdownContent) return filters
    
    filterDropdownContent.querySelectorAll('[data-filter="type"]:checked').forEach(checkbox => {
      filters.type.push(checkbox.value)
    })
    
    filterDropdownContent.querySelectorAll('[data-filter="genre"]:checked').forEach(checkbox => {
      filters.genre.push(checkbox.value)
    })
    
    return filters
  }
  
  function hasActiveFilters(filters) {
    return filters.type.length > 0 || filters.genre.length > 0
  }
  
  function applyFilters() {
    const query = searchInput.value.trim().toLowerCase()
    performSearch(query)
    filterDropdownContent.classList.remove('active')
  }
  
  function resetFilters() {
    filterDropdownContent.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.checked = true
    })
    
    applyFilters()
  }
  
  function renderFilteredMovies(filteredMovies) {
    if (!movieTableBody) return
    
    movieTableBody.innerHTML = ''
    
    if (filteredMovies.length === 0) {
      const emptyRow = document.createElement('tr')
      emptyRow.innerHTML = `
        <td colspan="7">
          <div class="empty-state">
            <i class="fas fa-search"></i>
            <h3>No movies found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        </td>
      `
      movieTableBody.appendChild(emptyRow)
      return
    }
    
    filteredMovies.forEach(movie => {
      const row = document.createElement('tr')
      row.setAttribute('data-id', movie.movie_id)
      
      const releaseDate = new Date(movie.release_date)
      const formattedDate = releaseDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
      
      const defaultPoster = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNTAiIGhlaWdodD0iMjI1IiBmaWxsPSIjZGRkZGRkIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjIyNSIgZmlsbD0iI2VlZWVlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ibW9ub3NwYWNlIiBmb250LXNpemU9IjE2cHgiIGZpbGw9IiM5OTk5OTkiPk5vIFBvc3RlcjwvdGV4dD48L3N2Zz4='
      const posterUrl = movie.poster || defaultPoster

      row.innerHTML = `
        <td>
          <img src="${posterUrl}" alt="${movie.title}" class="movie-poster">
        </td>
        <td>${movie.title}</td>
        <td>${movie.genre || 'N/A'}</td>
        <td>${movie.duration || 0} min</td>
        <td><span class="badge badge-${(movie.rating || 'PG').toLowerCase().replace('-', '')}">${movie.rating || 'PG'}</span></td>
        <td>${formattedDate}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-sm btn-outline-primary edit-movie" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger delete-movie" title="Delete">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      `
      
      movieTableBody.appendChild(row)
    })
    
    attachMovieActionListeners()
  }
  
  function renderFilteredCinemas(filteredCinemas) {
    if (!cinemaTableBody) return
    
    cinemaTableBody.innerHTML = ''
    
    if (filteredCinemas.length === 0) {
      const emptyRow = document.createElement('tr')
      emptyRow.innerHTML = `
        <td colspan="5">
          <div class="empty-state">
            <i class="fas fa-search"></i>
            <h3>No cinemas found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        </td>
      `
      cinemaTableBody.appendChild(emptyRow)
      return
    }
    
    filteredCinemas.forEach(cinema => {
      const row = document.createElement('tr')
      row.setAttribute('data-id', cinema.cinema_id)
      
      row.innerHTML = `
        <td>${cinema.name || 'N/A'}</td>
        <td>${cinema.city || 'N/A'}</td>
        <td>${cinema.address || 'N/A'}</td>
        <td>${cinema.contact_number || 'N/A'}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-sm btn-outline-primary edit-cinema" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger delete-cinema" title="Delete">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      `
      
      cinemaTableBody.appendChild(row)
    })
    
    attachCinemaActionListeners()
  }
  
  function renderFilteredBookings(filteredBookings) {
    if (!bookingTableBody) return
    
    bookingTableBody.innerHTML = ''
    
    if (filteredBookings.length === 0) {
      const emptyRow = document.createElement('tr')
      emptyRow.innerHTML = `
        <td colspan="6">
          <div class="empty-state">
            <i class="fas fa-search"></i>
            <h3>No bookings found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        </td>
      `
      bookingTableBody.appendChild(emptyRow)
      return
    }
    
    filteredBookings.forEach(booking => {
      const row = document.createElement('tr')
      row.setAttribute('data-id', booking.booking_id)
      
      const bookingDate = new Date(booking.booking_date)
      const formattedDate = !isNaN(bookingDate) ? bookingDate.toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      }) : 'Invalid Date'
      
      row.innerHTML = `
        <td>${booking.username || 'N/A'}</td>
        <td>${booking.movie_title || 'N/A'}</td>
        <td>${formattedDate}</td>
        <td><span class="badge badge-${(booking.booking_status || 'pending').toLowerCase()}">${booking.booking_status || 'Pending'}</span></td>
        <td>${booking.promo_code || 'None'}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-sm btn-outline-primary edit-booking" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger delete-booking" title="Delete">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      `
      
      bookingTableBody.appendChild(row)
    })
    
    attachBookingActionListeners()
  }
  
  function renderEmptyMoviesFilter() {
    if (!movieTableBody) return
    
    movieTableBody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-state">
            <i class="fas fa-filter"></i>
            <h3>Movies filtered out</h3>
            <p>Movies are currently filtered out</p>
          </div>
        </td>
      </tr>
    `
  }
  
  function renderEmptyCinemasFilter() {
    if (!cinemaTableBody) return
    
    cinemaTableBody.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="empty-state">
            <i class="fas fa-filter"></i>
            <h3>Cinemas filtered out</h3>
            <p>Cinemas are currently filtered out</p>
          </div>
        </td>
      </tr>
    `
  }
  
  function renderEmptyBookingsFilter() {
    if (!bookingTableBody) return
    
    bookingTableBody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">
            <i class="fas fa-filter"></i>
            <h3>Bookings filtered out</h3>
            <p>Bookings are currently filtered out</p>
          </div>
        </td>
      </tr>
    `
  }

  function initApp() {
      Promise.all([
          fetchMovies().catch(err => console.error('Error in fetchMovies:', err)),
          fetchCinemas().catch(err => console.error('Error in fetchCinemas:', err)),
          fetchBookings().catch(err => console.error('Error in fetchBookings:', err))
      ]).then(() => {
          showNotification('Application loaded successfully', 'success')
      }).catch(error => {
          console.error('Error initializing app:', error)
          showNotification('There was a problem loading some data. Please try refreshing.', 'error')
      })
  }

    window.addEventListener('error', function(event) {
      console.error('Global error caught:', event.error)
  })
  
  initApp()
})