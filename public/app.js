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
  const USERS_API = `${API_BASE_URL}/users`
  const PROMOTIONS_API = `${API_BASE_URL}/promotions`
  
  let movies = []
  let cinemas = []
  let bookings = []
  let users = []
  let isEditMode = false
  let currentMovieId = null

  tabButtons.forEach(button => {
      button.addEventListener('click', () => {
          const tab = button.getAttribute('data-tab')
          
          tabButtons.forEach(btn => btn.classList.remove('active'))
          button.classList.add('active')
          
          tabContents.forEach(content => content.classList.remove('active'))
          document.getElementById(`${tab}-tab`).classList.add('active')
          
          // Update the title text based on the active tab
          const titleText = document.getElementById('content-title-text')
          if (titleText) {
              switch(tab) {
                  case 'movies':
                      titleText.innerText = 'Movie Management'
                      break
                  case 'cinemas':
                      titleText.innerText = 'Cinema Management'
                      break
                  case 'bookings':
                      titleText.innerText = 'Booking Management'
                      break
                  case 'users':
                      titleText.innerText = 'User Management'
                      break
                  case 'reports':
                      titleText.innerText = 'Reports & Analytics'
                      break
                  default:
                      titleText.innerText = 'Content Management'
              }
          }
          
          // Update the visible add button based on the active tab
          updateActionButtons(tab)
      })
  })
  
  // Function to update action buttons based on active tab
  function updateActionButtons(activeTab) {
      const actionButtons = document.querySelectorAll('.action-button')
      
      actionButtons.forEach(button => {
          const buttonTab = button.getAttribute('data-tab')
          if (buttonTab === activeTab) {
              button.classList.add('active')
          } else {
              button.classList.remove('active')
          }
      })
  }

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

  // Initialize action buttons
  const actionButtons = document.querySelectorAll('.action-button')
  actionButtons.forEach(button => {
      const buttonId = button.id
      
      if (buttonId === 'add-movie-btn') {
          button.addEventListener('click', () => {
              if (movieForm) movieForm.reset()
              isEditMode = false
              currentMovieId = null
              document.querySelector('#add-movie-modal .modal-title').innerHTML = '<i class="fas fa-film"></i> Add New Movie'
              openModal('add-movie-modal')
          })
      } else if (buttonId === 'add-cinema-btn') {
          button.addEventListener('click', handleAddCinema)
      } else if (buttonId === 'add-booking-btn') {
          button.addEventListener('click', handleAddBooking)
      } else if (buttonId === 'add-user-btn') {
          button.addEventListener('click', handleAddUser)
      }
  })

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
                  <button class="btn btn-sm btn-primary buy-tickets" title="Buy Tickets">
                      <i class="fas fa-ticket-alt"></i> Buy Tickets
                  </button>
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
      const buyTicketsButtons = document.querySelectorAll('.buy-tickets')
      
      editButtons.forEach(button => {
          button.addEventListener('click', handleEditMovie)
      })
      
      deleteButtons.forEach(button => {
          button.addEventListener('click', handleDeleteMovie)
      })
      
      buyTicketsButtons.forEach(button => {
          button.addEventListener('click', handleBuyTickets)
      })
  }
  
  function handleBuyTickets(e) {
      const row = e.target.closest('tr')
      const movieId = parseInt(row.getAttribute('data-id'))
      const movie = movies.find(m => m.movie_id === movieId)
      
      if (movie && window.SeatSelection) {
          window.SeatSelection.openShowtimeSelectionForMovie(movie)
      }
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
      const cinema = cinemas.find(c => c.cinema_id === cinemaId)
      
      if (cinema) {
          openEditCinemaModal(cinema)
      }
  }
  
  function openEditCinemaModal(cinema) {
      const modalHtml = `
          <div class="modal-overlay active" id="edit-cinema-modal">
              <div class="modal">
                  <div class="modal-header">
                      <h3 class="modal-title">
                          <i class="fas fa-building"></i> Edit Cinema
                      </h3>
                      <button class="modal-close">&times;</button>
                  </div>
                  <div class="modal-body">
                      <form id="cinema-form">
                          <input type="hidden" id="cinema-id" value="${cinema.cinema_id}">
                          <div class="form-group">
                              <label class="form-label">Cinema Name</label>
                              <input type="text" id="cinema-name" class="form-control" value="${cinema.name || ''}" placeholder="Enter cinema name">
                          </div>
                          <div class="form-group">
                              <label class="form-label">City</label>
                              <input type="text" id="cinema-city" class="form-control" value="${cinema.city || ''}" placeholder="Enter city">
                          </div>
                          <div class="form-group">
                              <label class="form-label">Address</label>
                              <input type="text" id="cinema-address" class="form-control" value="${cinema.address || ''}" placeholder="Enter address">
                          </div>
                          <div class="form-group">
                              <label class="form-label">Contact Number</label>
                              <input type="text" id="cinema-contact" class="form-control" value="${cinema.contact_number || ''}" placeholder="Enter contact number">
                          </div>
                      </form>
                  </div>
                  <div class="modal-footer">
                      <button class="btn btn-secondary cinema-modal-cancel">Cancel</button>
                      <button class="btn btn-primary" id="save-cinema-btn">Save Cinema</button>
                  </div>
              </div>
          </div>
      `
      
      document.body.insertAdjacentHTML('beforeend', modalHtml)
      
      document.querySelector('#edit-cinema-modal .modal-close').addEventListener('click', () => {
          document.getElementById('edit-cinema-modal').remove()
      })
      
      document.querySelector('.cinema-modal-cancel').addEventListener('click', () => {
          document.getElementById('edit-cinema-modal').remove()
      })
      
      document.getElementById('save-cinema-btn').addEventListener('click', () => {
          const cinemaData = {
              name: document.getElementById('cinema-name').value,
              city: document.getElementById('cinema-city').value,
              address: document.getElementById('cinema-address').value,
              contact_number: document.getElementById('cinema-contact').value
          }
          
          if (!cinemaData.name) {
              showNotification('Cinema name is required', 'error')
              return
          }
          
          updateCinema(cinema.cinema_id, cinemaData)
          document.getElementById('edit-cinema-modal').remove()
      })
  }
  
  async function updateCinema(id, cinemaData) {
      try {
          const response = await fetch(`${CINEMAS_API}/${id}`, {
              method: 'PUT',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify(cinemaData)
          })
          
          if (!response.ok) {
              const errorData = await response.json()
              throw new Error(errorData.message || 'Failed to update cinema')
          }
          
          await fetchCinemas()
          showNotification('Cinema updated successfully', 'success')
      } catch (error) {
          console.error('Error updating cinema:', error)
          showNotification('Failed to update cinema: ' + error.message, 'error')
      }
  }
  
  function handleDeleteCinema(e) {
      const row = e.target.closest('tr')
      const cinemaId = parseInt(row.getAttribute('data-id'))
      const cinemaName = row.cells[0].textContent
      
      if (confirm(`Are you sure you want to delete "${cinemaName}"? This action cannot be undone.`)) {
          deleteCinema(cinemaId)
      }
  }
  
  async function deleteCinema(id) {
      try {
          const response = await fetch(`${CINEMAS_API}/${id}`, {
              method: 'DELETE'
          })
          
          if (!response.ok) {
              const errorData = await response.json()
              throw new Error(errorData.message || 'Failed to delete cinema')
          }
          
          await fetchCinemas()
          showNotification('Cinema deleted successfully', 'success')
      } catch (error) {
          console.error('Error deleting cinema:', error)
          showNotification('Failed to delete cinema: ' + error.message, 'error')
      }
  }
  
  function handleEditBooking(e) {
      const row = e.target.closest('tr')
      const bookingId = parseInt(row.getAttribute('data-id'))
      const booking = bookings.find(b => b.booking_id === bookingId)
      
      if (booking) {
          openEditBookingModal(booking)
      }
  }
  
  function openEditBookingModal(booking) {
      const modalHtml = `
          <div class="modal-overlay active" id="edit-booking-modal">
              <div class="modal">
                  <div class="modal-header">
                      <h3 class="modal-title">
                          <i class="fas fa-ticket-alt"></i> Edit Booking
                      </h3>
                      <button class="modal-close">&times;</button>
                  </div>
                  <div class="modal-body">
                      <form id="booking-form">
                          <input type="hidden" id="booking-id" value="${booking.booking_id}">
                          <div class="form-group">
                              <label class="form-label">Booking Status</label>
                              <select id="booking-status" class="form-control form-select">
                                  <option value="PENDING" ${booking.booking_status === 'PENDING' ? 'selected' : ''}>Pending</option>
                                  <option value="CONFIRMED" ${booking.booking_status === 'CONFIRMED' ? 'selected' : ''}>Confirmed</option>
                                  <option value="CANCELLED" ${booking.booking_status === 'CANCELLED' ? 'selected' : ''}>Cancelled</option>
                              </select>
                          </div>
                          <div class="form-group">
                              <label class="form-label">Promotion</label>
                              <select id="booking-promotion" class="form-control form-select">
                                  <option value="">No Promotion</option>
                                  <!-- Promotions will be populated dynamically -->
                              </select>
                          </div>
                          <div class="booking-details">
                              <div class="detail-item">
                                  <span class="detail-label">User:</span>
                                  <span class="detail-value">${booking.username || 'N/A'}</span>
                              </div>
                              <div class="detail-item">
                                  <span class="detail-label">Movie:</span>
                                  <span class="detail-value">${booking.movie_title || 'N/A'}</span>
                              </div>
                              <div class="detail-item">
                                  <span class="detail-label">Booking Date:</span>
                                  <span class="detail-value">${new Date(booking.booking_date).toLocaleString() || 'N/A'}</span>
                              </div>
                          </div>
                      </form>
                  </div>
                  <div class="modal-footer">
                      <button class="btn btn-secondary booking-modal-cancel">Cancel</button>
                      <button class="btn btn-primary" id="save-booking-btn">Save Changes</button>
                  </div>
              </div>
          </div>
      `
      
      document.body.insertAdjacentHTML('beforeend', modalHtml)
      
      // Load promotions
      fetchPromotions().then(promos => {
          const promoSelect = document.getElementById('booking-promotion')
          if (promoSelect) {
              promos.forEach(promo => {
                  const option = document.createElement('option')
                  option.value = promo.promotion_id
                  option.textContent = promo.promo_code
                  option.selected = booking.promotion_id === promo.promotion_id
                  promoSelect.appendChild(option)
              })
          }
      }).catch(err => {
          console.error('Error loading promotions:', err)
      })
      
      document.querySelector('#edit-booking-modal .modal-close').addEventListener('click', () => {
          document.getElementById('edit-booking-modal').remove()
      })
      
      document.querySelector('.booking-modal-cancel').addEventListener('click', () => {
          document.getElementById('edit-booking-modal').remove()
      })
      
      document.getElementById('save-booking-btn').addEventListener('click', () => {
          const bookingData = {
              booking_status: document.getElementById('booking-status').value,
              promotion_id: document.getElementById('booking-promotion').value || null
          }
          
          updateBooking(booking.booking_id, bookingData)
          document.getElementById('edit-booking-modal').remove()
      })
  }
  
  async function fetchPromotions() {
      try {
          const response = await fetch(PROMOTIONS_API)
          if (!response.ok) {
              throw new Error(`Failed to fetch promotions: ${response.status}`)
          }
          return await response.json()
      } catch (error) {
          console.error('Error fetching promotions:', error)
          return []
      }
  }
  
  async function updateBooking(id, bookingData) {
      try {
          const response = await fetch(`${BOOKINGS_API}/${id}`, {
              method: 'PUT',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify(bookingData)
          })
          
          if (!response.ok) {
              const errorData = await response.json()
              throw new Error(errorData.message || 'Failed to update booking')
          }
          
          await fetchBookings()
          showNotification('Booking updated successfully', 'success')
      } catch (error) {
          console.error('Error updating booking:', error)
          showNotification('Failed to update booking: ' + error.message, 'error')
      }
  }
  
  function handleDeleteBooking(e) {
      const row = e.target.closest('tr')
      const bookingId = parseInt(row.getAttribute('data-id'))
      const userName = row.cells[0].textContent
      
      if (confirm(`Are you sure you want to delete booking for "${userName}"? This will also delete all associated tickets.`)) {
          deleteBooking(bookingId)
      }
  }
  
  async function deleteBooking(id) {
      try {
          const response = await fetch(`${BOOKINGS_API}/${id}`, {
              method: 'DELETE'
          })
          
          if (!response.ok) {
              const errorData = await response.json()
              throw new Error(errorData.message || 'Failed to delete booking')
          }
          
          await fetchBookings()
          showNotification('Booking deleted successfully', 'success')
      } catch (error) {
          console.error('Error deleting booking:', error)
          showNotification('Failed to delete booking: ' + error.message, 'error')
      }
  }

  function updateSummary() {
      if (totalCinemasEl) totalCinemasEl.textContent = cinemas.length || 0
      if (totalMoviesEl) totalMoviesEl.textContent = movies.length || 0
      if (totalBookingsEl) totalBookingsEl.textContent = bookings.length || 0
      
      // Update report stats
      updateReportStats()
  }
  
  function updateReportStats() {
      const totalBookingsEl = document.getElementById('total-bookings')
      const confirmedBookingsEl = document.getElementById('confirmed-bookings')
      const pendingBookingsEl = document.getElementById('pending-bookings')
      const totalMoviesEl = document.getElementById('total-movies')
      const popularGenreEl = document.getElementById('popular-genre')
      
      if (totalBookingsEl) totalBookingsEl.textContent = bookings.length || 0
      
      if (confirmedBookingsEl && bookings.length > 0) {
          const confirmedCount = bookings.filter(b => b.booking_status === 'CONFIRMED').length
          confirmedBookingsEl.textContent = confirmedCount
      }
      
      if (pendingBookingsEl && bookings.length > 0) {
          const pendingCount = bookings.filter(b => b.booking_status === 'PENDING').length
          pendingBookingsEl.textContent = pendingCount
      }
      
      if (totalMoviesEl) totalMoviesEl.textContent = movies.length || 0
      
      if (popularGenreEl && movies.length > 0) {
          const genreCounts = {}
          movies.forEach(movie => {
              if (movie.genre) {
                  genreCounts[movie.genre] = (genreCounts[movie.genre] || 0) + 1
              }
          })
          
          let maxCount = 0
          let popularGenre = 'None'
          
          for (const genre in genreCounts) {
              if (genreCounts[genre] > maxCount) {
                  maxCount = genreCounts[genre]
                  popularGenre = genre
              }
          }
          
          popularGenreEl.textContent = popularGenre
      }
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
            <label class="filter-option">
              <input type="checkbox" data-filter="type" value="user" checked> Users
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
      renderUsers()
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
    
    if (activeFilters.type.includes('user')) {
      const filteredUsers = users.filter(user => {
        return query.length === 0 || 
          (user.username && user.username.toLowerCase().includes(query)) ||
          (user.email && user.email.toLowerCase().includes(query)) ||
          (user.phone_number && user.phone_number && user.phone_number.toLowerCase().includes(query))
      })
      
      renderFilteredUsers(filteredUsers)
    } else {
      renderEmptyUsersFilter()
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
            <button class="btn btn-sm btn-primary buy-tickets" title="Buy Tickets">
              <i class="fas fa-ticket-alt"></i> Buy Tickets
            </button>
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
          // Load users separately to avoid breaking the app if there's an error
          fetchUsers().catch(err => console.error('Error in fetchUsers:', err));
          showNotification('Application loaded successfully', 'success')
          initReports()
          
          // Initialize the action buttons for the current active tab
          const activeTab = document.querySelector('.tab-btn.active')
          if (activeTab) {
              updateActionButtons(activeTab.getAttribute('data-tab'))
          }
          
          // Set the initial title
          const titleText = document.getElementById('content-title-text')
          if (titleText && activeTab) {
              const tab = activeTab.getAttribute('data-tab')
              switch(tab) {
                  case 'movies':
                      titleText.innerText = 'Movie Management'
                      break
                  case 'cinemas':
                      titleText.innerText = 'Cinema Management'
                      break
                  case 'bookings':
                      titleText.innerText = 'Booking Management'
                      break
                  case 'users':
                      titleText.innerText = 'User Management'
                      break
                  case 'reports':
                      titleText.innerText = 'Reports & Analytics'
                      break
                  default:
                      titleText.innerText = 'Content Management'
              }
          }
      }).catch(error => {
          console.error('Error initializing app:', error)
          showNotification('There was a problem loading some data. Please try refreshing.', 'error')
      })
  }
  
  function handleAddCinema() {
      const modalHtml = `
          <div class="modal-overlay active" id="add-cinema-modal">
              <div class="modal">
                  <div class="modal-header">
                      <h3 class="modal-title">
                          <i class="fas fa-building"></i> Add New Cinema
                      </h3>
                      <button class="modal-close">&times;</button>
                  </div>
                  <div class="modal-body">
                      <form id="cinema-form">
                          <div class="form-group">
                              <label class="form-label">Cinema Name</label>
                              <input type="text" id="cinema-name" class="form-control" placeholder="Enter cinema name">
                          </div>
                          <div class="form-group">
                              <label class="form-label">City</label>
                              <input type="text" id="cinema-city" class="form-control" placeholder="Enter city">
                          </div>
                          <div class="form-group">
                              <label class="form-label">Address</label>
                              <input type="text" id="cinema-address" class="form-control" placeholder="Enter address">
                          </div>
                          <div class="form-group">
                              <label class="form-label">Contact Number</label>
                              <input type="text" id="cinema-contact" class="form-control" placeholder="Enter contact number">
                          </div>
                      </form>
                  </div>
                  <div class="modal-footer">
                      <button class="btn btn-secondary cinema-modal-cancel">Cancel</button>
                      <button class="btn btn-primary" id="save-cinema-btn">Save Cinema</button>
                  </div>
              </div>
          </div>
      `
      
      document.body.insertAdjacentHTML('beforeend', modalHtml)
      
      document.querySelector('#add-cinema-modal .modal-close').addEventListener('click', () => {
          document.getElementById('add-cinema-modal').remove()
      })
      
      document.querySelector('.cinema-modal-cancel').addEventListener('click', () => {
          document.getElementById('add-cinema-modal').remove()
      })
      
      document.getElementById('save-cinema-btn').addEventListener('click', () => {
          const cinemaData = {
              name: document.getElementById('cinema-name').value,
              city: document.getElementById('cinema-city').value,
              address: document.getElementById('cinema-address').value,
              contact_number: document.getElementById('cinema-contact').value
          }
          
          if (!cinemaData.name) {
              showNotification('Cinema name is required', 'error')
              return
          }
          
          createCinema(cinemaData)
          document.getElementById('add-cinema-modal').remove()
      })
  }
  
  async function createCinema(cinemaData) {
      try {
          const response = await fetch(CINEMAS_API, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify(cinemaData)
          })
          
          if (!response.ok) {
              const errorData = await response.json()
              throw new Error(errorData.message || 'Failed to create cinema')
          }
          
          await fetchCinemas()
          showNotification('Cinema created successfully', 'success')
      } catch (error) {
          console.error('Error creating cinema:', error)
          showNotification('Failed to create cinema: ' + error.message, 'error')
      }
  }
  
  function handleAddBooking() {
      const modalHtml = `
          <div class="modal-overlay active" id="add-booking-modal">
              <div class="modal">
                  <div class="modal-header">
                      <h3 class="modal-title">
                          <i class="fas fa-ticket-alt"></i> Add New Booking
                      </h3>
                      <button class="modal-close">&times;</button>
                  </div>
                  <div class="modal-body">
                      <form id="booking-form">
                          <div class="form-group">
                              <label class="form-label">User</label>
                              <select id="booking-user" class="form-control form-select" required>
                                  <option value="">Select a user</option>
                                  <!-- Users will be populated dynamically -->
                              </select>
                          </div>
                          <div class="form-group">
                              <label class="form-label">Booking Status</label>
                              <select id="booking-status" class="form-control form-select">
                                  <option value="PENDING">Pending</option>
                                  <option value="CONFIRMED">Confirmed</option>
                                  <option value="CANCELLED">Cancelled</option>
                              </select>
                          </div>
                          <div class="form-group">
                              <label class="form-label">Promotion (Optional)</label>
                              <select id="booking-promotion" class="form-control form-select">
                                  <option value="">No Promotion</option>
                                  <!-- Promotions will be populated dynamically -->
                              </select>
                          </div>
                          <div class="form-note">
                              <p>Note: After creating the booking, you'll need to add tickets separately using the seat selection interface.</p>
                          </div>
                      </form>
                  </div>
                  <div class="modal-footer">
                      <button class="btn btn-secondary booking-modal-cancel">Cancel</button>
                      <button class="btn btn-primary" id="save-booking-btn">Create Booking</button>
                  </div>
              </div>
          </div>
      `
      
      document.body.insertAdjacentHTML('beforeend', modalHtml)
      
      // Load users
      const userSelect = document.getElementById('booking-user')
      users.forEach(user => {
          const option = document.createElement('option')
          option.value = user.users_id
          option.textContent = user.username
          userSelect.appendChild(option)
      })
      
      // Load promotions
      fetchPromotions().then(promos => {
          const promoSelect = document.getElementById('booking-promotion')
          if (promoSelect) {
              promos.forEach(promo => {
                  const option = document.createElement('option')
                  option.value = promo.promotion_id
                  option.textContent = promo.promo_code
                  promoSelect.appendChild(option)
              })
          }
      }).catch(err => {
          console.error('Error loading promotions:', err)
      })
      
      document.querySelector('#add-booking-modal .modal-close').addEventListener('click', () => {
          document.getElementById('add-booking-modal').remove()
      })
      
      document.querySelector('.booking-modal-cancel').addEventListener('click', () => {
          document.getElementById('add-booking-modal').remove()
      })
      
      document.getElementById('save-booking-btn').addEventListener('click', () => {
          const userId = document.getElementById('booking-user').value
          
          if (!userId) {
              showNotification('Please select a user', 'error')
              return
          }
          
          const bookingData = {
              users_id: userId,
              booking_status: document.getElementById('booking-status').value,
              promotion_id: document.getElementById('booking-promotion').value || null
          }
          
          createBooking(bookingData)
          document.getElementById('add-booking-modal').remove()
      })
  }
  
  async function createBooking(bookingData) {
      try {
          const response = await fetch(BOOKINGS_API, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify(bookingData)
          })
          
          if (!response.ok) {
              const errorData = await response.json()
              throw new Error(errorData.message || 'Failed to create booking')
          }
          
          await fetchBookings()
          showNotification('Booking created successfully', 'success')
      } catch (error) {
          console.error('Error creating booking:', error)
          showNotification('Failed to create booking: ' + error.message, 'error')
      }
  }
  
  function initReports() {
      const startDateInput = document.getElementById('report-start-date')
      const endDateInput = document.getElementById('report-end-date')
      const generateReportBtn = document.getElementById('generate-report-btn')
      
      // Set default date range to current month
      if (startDateInput && endDateInput) {
          const today = new Date()
          const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
          const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
          
          startDateInput.value = formatDateForInput(firstDay)
          endDateInput.value = formatDateForInput(lastDay)
      }
      
      if (generateReportBtn) {
          generateReportBtn.addEventListener('click', generateReport)
      }
      
      updateReportStats()
  }
  
  function formatDateForInput(date) {
      return date.toISOString().split('T')[0]
  }
  
  function generateReport() {
      const startDate = document.getElementById('report-start-date').value
      const endDate = document.getElementById('report-end-date').value
      
      if (!startDate || !endDate) {
          showNotification('Please select both start and end dates', 'error')
          return
      }
      
      // Filter bookings by date range
      const filteredBookings = bookings.filter(booking => {
          const bookingDate = new Date(booking.booking_date)
          return bookingDate >= new Date(startDate) && bookingDate <= new Date(endDate)
      })
      
      // Update report stats with filtered data
      const totalBookingsEl = document.getElementById('total-bookings')
      const confirmedBookingsEl = document.getElementById('confirmed-bookings')
      const pendingBookingsEl = document.getElementById('pending-bookings')
      
      if (totalBookingsEl) totalBookingsEl.textContent = filteredBookings.length || 0
      
      if (confirmedBookingsEl) {
          const confirmedCount = filteredBookings.filter(b => b.booking_status === 'CONFIRMED').length
          confirmedBookingsEl.textContent = confirmedCount
      }
      
      if (pendingBookingsEl) {
          const pendingCount = filteredBookings.filter(b => b.booking_status === 'PENDING').length
          pendingBookingsEl.textContent = pendingCount
      }
      
      showNotification('Report generated successfully for the selected date range', 'success')
  }

    // Users management
  async function fetchUsers() {
    try {
      const response = await fetch(USERS_API)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Server response:', response.status, errorData)
        throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`)
      }
      users = await response.json()
      renderUsers()
      updateSummary()
    } catch (error) {
      console.error('Error fetching users:', error)
      showNotification('Failed to load users: ' + error.message, 'error')
      renderUsers()
    }
  }
  
  // Add User button in the users tab
  function handleAddUser() {
    const modalHtml = `
      <div class="modal-overlay active" id="add-user-modal">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title">
              <i class="fas fa-user"></i> Add New User
            </h3>
            <button class="modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <form id="user-form">
              <div class="form-group">
                <label class="form-label">Username</label>
                <input type="text" id="user-username" class="form-control" placeholder="Enter username">
              </div>
              <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" id="user-email" class="form-control" placeholder="Enter email">
              </div>
              <div class="form-group">
                <label class="form-label">Password</label>
                <input type="password" id="user-password" class="form-control" placeholder="Enter password">
              </div>
              <div class="form-group">
                <label class="form-label">Phone Number</label>
                <input type="text" id="user-phone" class="form-control" placeholder="Enter phone number">
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary user-modal-cancel">Cancel</button>
            <button class="btn btn-primary" id="save-user-btn">Save User</button>
          </div>
        </div>
      </div>
    `
    
    document.body.insertAdjacentHTML('beforeend', modalHtml)
    
    document.querySelector('#add-user-modal .modal-close').addEventListener('click', () => {
      document.getElementById('add-user-modal').remove()
    })
    
    document.querySelector('.user-modal-cancel').addEventListener('click', () => {
      document.getElementById('add-user-modal').remove()
    })
    
    document.getElementById('save-user-btn').addEventListener('click', () => {
      const userData = {
        username: document.getElementById('user-username').value,
        email: document.getElementById('user-email').value,
        password: document.getElementById('user-password').value,
        phone_number: document.getElementById('user-phone').value
      }
      
      if (!userData.username || !userData.email || !userData.password) {
        showNotification('Username, email and password are required', 'error')
        return
      }
      
      createUser(userData)
      document.getElementById('add-user-modal').remove()
    })
  }
  
  async function createUser(userData) {
    try {
      const response = await fetch(USERS_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create user')
      }
      
      await fetchUsers()
      showNotification('User created successfully', 'success')
    } catch (error) {
      console.error('Error creating user:', error)
      showNotification('Failed to create user: ' + error.message, 'error')
    }
  }
  
  function renderUsers() {
    const usersTableBody = document.querySelector('#users-tab tbody')
    if (!usersTableBody) return
    
    usersTableBody.innerHTML = ''
    
    if (users.length === 0) {
      const emptyRow = document.createElement('tr')
      emptyRow.innerHTML = `
        <td colspan="5">
          <div class="empty-state">
            <i class="fas fa-users"></i>
            <h3>No users available</h3>
            <p>Add a new user to get started</p>
          </div>
        </td>
      `
      usersTableBody.appendChild(emptyRow)
      return
    }
    
    users.forEach(user => {
      const row = document.createElement('tr')
      row.setAttribute('data-id', user.users_id)
      
      const regDate = new Date(user.registration_date)
      const formattedDate = !isNaN(regDate) ? regDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
      }) : 'N/A'
      
      row.innerHTML = `
        <td>${user.username || 'N/A'}</td>
        <td>${user.email || 'N/A'}</td>
        <td>${user.phone_number || 'N/A'}</td>
        <td>${formattedDate}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-sm btn-outline-primary edit-user" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger delete-user" title="Delete">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      `
      
      usersTableBody.appendChild(row)
    })
    
    attachUserActionListeners()
  }
  
  function attachUserActionListeners() {
    const usersTableBody = document.querySelector('#users-tab tbody')
    if (!usersTableBody) return
    
    const editButtons = document.querySelectorAll('.edit-user')
    const deleteButtons = document.querySelectorAll('.delete-user')
    
    editButtons.forEach(button => {
      button.addEventListener('click', handleEditUser)
    })
    
    deleteButtons.forEach(button => {
      button.addEventListener('click', handleDeleteUser)
    })
  }
  
  function handleEditUser(e) {
    const row = e.target.closest('tr')
    const userId = parseInt(row.getAttribute('data-id'))
    const user = users.find(u => u.users_id === userId)
    
    if (user) {
      openEditUserModal(user)
    }
  }
  
  function openEditUserModal(user) {
    const modalHtml = `
      <div class="modal-overlay active" id="edit-user-modal">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title">
              <i class="fas fa-user"></i> Edit User
            </h3>
            <button class="modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <form id="user-form">
              <input type="hidden" id="user-id" value="${user.users_id}">
              <div class="form-group">
                <label class="form-label">Username</label>
                <input type="text" id="user-username" class="form-control" value="${user.username || ''}" placeholder="Enter username">
              </div>
              <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" id="user-email" class="form-control" value="${user.email || ''}" placeholder="Enter email">
              </div>
              <div class="form-group">
                <label class="form-label">Phone Number</label>
                <input type="text" id="user-phone" class="form-control" value="${user.phone_number || ''}" placeholder="Enter phone number">
              </div>
              <div class="form-group">
                <label class="form-label">Password</label>
                <input type="password" id="user-password" class="form-control" placeholder="Enter new password (leave empty to keep current)">
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary user-modal-cancel">Cancel</button>
            <button class="btn btn-primary" id="save-user-btn">Save User</button>
          </div>
        </div>
      </div>
    `
    
    document.body.insertAdjacentHTML('beforeend', modalHtml)
    
    document.querySelector('#edit-user-modal .modal-close').addEventListener('click', () => {
      document.getElementById('edit-user-modal').remove()
    })
    
    document.querySelector('.user-modal-cancel').addEventListener('click', () => {
      document.getElementById('edit-user-modal').remove()
    })
    
    document.getElementById('save-user-btn').addEventListener('click', () => {
      const userData = {
        username: document.getElementById('user-username').value,
        email: document.getElementById('user-email').value,
        phone_number: document.getElementById('user-phone').value,
        password: document.getElementById('user-password').value || undefined
      }
      
      if (!userData.username || !userData.email) {
        showNotification('Username and email are required', 'error')
        return
      }
      
      updateUser(user.users_id, userData)
      document.getElementById('edit-user-modal').remove()
    })
  }
  
  async function updateUser(id, userData) {
    try {
      const response = await fetch(`${USERS_API}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update user')
      }
      
      await fetchUsers()
      showNotification('User updated successfully', 'success')
    } catch (error) {
      console.error('Error updating user:', error)
      showNotification('Failed to update user: ' + error.message, 'error')
    }
  }
  
  function handleDeleteUser(e) {
    const row = e.target.closest('tr')
    const userId = parseInt(row.getAttribute('data-id'))
    const username = row.cells[0].textContent
    
    if (confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      deleteUser(userId)
    }
  }
  
  async function deleteUser(id) {
    try {
      const response = await fetch(`${USERS_API}/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to delete user')
      }
      
      await fetchUsers()
      showNotification('User deleted successfully', 'success')
    } catch (error) {
      console.error('Error deleting user:', error)
      showNotification('Failed to delete user: ' + error.message, 'error')
    }
  }

  function renderEmptyUsersFilter() {
      const usersTableBody = document.querySelector('#users-tab tbody')
      if (!usersTableBody) return
      
      usersTableBody.innerHTML = `
          <tr>
              <td colspan="5">
                  <div class="empty-state">
                      <i class="fas fa-filter"></i>
                      <h3>Users filtered out</h3>
                      <p>Users are currently filtered out</p>
                  </div>
              </td>
          </tr>
      `
  }
  
  function renderFilteredUsers(filteredUsers) {
    const usersTableBody = document.querySelector('#users-tab tbody')
    if (!usersTableBody) return
    
    usersTableBody.innerHTML = ''
    
    if (filteredUsers.length === 0) {
      const emptyRow = document.createElement('tr')
      emptyRow.innerHTML = `
        <td colspan="5">
          <div class="empty-state">
            <i class="fas fa-search"></i>
            <h3>No users found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        </td>
      `
      usersTableBody.appendChild(emptyRow)
      return
    }
    
    filteredUsers.forEach(user => {
      const row = document.createElement('tr')
      row.setAttribute('data-id', user.users_id)
      
      const regDate = new Date(user.registration_date)
      const formattedDate = !isNaN(regDate) ? regDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
      }) : 'N/A'
      
      row.innerHTML = `
        <td>${user.username || 'N/A'}</td>
        <td>${user.email || 'N/A'}</td>
        <td>${user.phone_number || 'N/A'}</td>
        <td>${formattedDate}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-sm btn-outline-primary edit-user" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger delete-user" title="Delete">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      `
      
      usersTableBody.appendChild(row)
    })
    
    attachUserActionListeners()
  }

  window.addEventListener('error', function(event) {
      console.error('Global error caught:', event.error)
  })
  
  // Expose fetchBookings to window so it can be called from other scripts
  window.fetchBookings = fetchBookings
  
  initApp()
})