/* Seat Selection Module */
document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const seatSelectionModal = document.getElementById('seat-selection-modal')
  const seatMap = document.getElementById('seat-map')
  const selectedSeatsList = document.getElementById('selected-seats-list')
  const totalPriceElement = document.getElementById('total-price')
  const seatsCountElement = document.querySelector('.seats-count')
  const proceedToCheckoutBtn = document.getElementById('proceed-to-checkout-btn')
  const backToShowtimesBtn = document.getElementById('back-to-showtimes-btn')
  const showTimeSelectionModal = document.getElementById('showtime-selection-modal')
  const checkoutModal = document.getElementById('checkout-modal')
  const backToSeatsBtn = document.getElementById('back-to-seats-btn')
  const completeBookingBtn = document.getElementById('complete-booking-btn')
  const bookingConfirmationModal = document.getElementById('booking-confirmation-modal')
  const closeConfirmationBtn = document.getElementById('close-confirmation-btn')
  const printTicketBtn = document.getElementById('print-ticket-btn')
  const closeSeatSelectionBtn = seatSelectionModal.querySelector('.modal-close')
  const closeShowtimeSelectionBtn = showTimeSelectionModal.querySelector('.modal-close')
  const showTimeModalCancelBtn = showTimeSelectionModal.querySelector('.showtime-modal-cancel')
  const closeCheckoutBtn = checkoutModal.querySelector('.modal-close')
  const closeConfirmationModalBtn = bookingConfirmationModal.querySelector('.modal-close')
  
  // State variables
  let selectedSeats = []
  let currentShowtime = null
  let currentMovie = null
  let basePrice = 0
  let selectedPromotion = null
  let allSeats = []
  let occupiedSeats = []
  
  // Constants for seat configuration
  const ROWS = 8
  const SEATS_PER_ROW = 12
  const ROW_LABELS = 'ABCDEFGHIJKLMNO'.split('')
  const SEAT_TYPES = {
    REGULAR: { type: 'regular', multiplier: 1.0 },
    PREMIUM: { type: 'premium', multiplier: 1.25 },
    VIP: { type: 'vip', multiplier: 1.5 },
    ACCESSIBLE: { type: 'accessible', multiplier: 1.0 }
  }
  
  // Initialize Event Listeners
  function initEventListeners() {
    // Proceed to checkout button
    if (proceedToCheckoutBtn) {
      proceedToCheckoutBtn.addEventListener('click', openCheckoutModal)
    }
    
    // Back to showtimes button
    if (backToShowtimesBtn) {
      backToShowtimesBtn.addEventListener('click', () => {
        closeSeatSelectionModal()
        openShowtimeSelectionModal()
      })
    }
    
    // Close seat selection modal
    if (closeSeatSelectionBtn) {
      closeSeatSelectionBtn.addEventListener('click', closeSeatSelectionModal)
    }
    
    // Close showtime selection modal
    if (closeShowtimeSelectionBtn) {
      closeShowtimeSelectionBtn.addEventListener('click', closeShowtimeSelectionModal)
    }
    
    // Showtime modal cancel button
    if (showTimeModalCancelBtn) {
      showTimeModalCancelBtn.addEventListener('click', closeShowtimeSelectionModal)
    }
    
    // Back to seats button
    if (backToSeatsBtn) {
      backToSeatsBtn.addEventListener('click', () => {
        closeCheckoutModal()
        openSeatSelectionModal()
      })
    }
    
    // Close checkout modal
    if (closeCheckoutBtn) {
      closeCheckoutBtn.addEventListener('click', closeCheckoutModal)
    }
    
    // Complete booking button
    if (completeBookingBtn) {
      completeBookingBtn.addEventListener('click', handleCompleteBooking)
    }
    
    // Close confirmation modal
    if (closeConfirmationBtn) {
      closeConfirmationBtn.addEventListener('click', closeBookingConfirmationModal)
    }
    
    // Close confirmation button
    if (closeConfirmationModalBtn) {
      closeConfirmationModalBtn.addEventListener('click', closeBookingConfirmationModal)
    }
    
    // Print ticket button
    if (printTicketBtn) {
      printTicketBtn.addEventListener('click', printTicket)
    }
    
    // Payment method change handling
    const paymentMethodSelect = document.getElementById('checkout-payment')
    if (paymentMethodSelect) {
      paymentMethodSelect.addEventListener('change', function() {
        const paymentMethod = this.value
        const creditCardElements = document.querySelectorAll('.credit-card-details')
        
        if (paymentMethod === 'CREDIT_CARD' || paymentMethod === 'DEBIT_CARD') {
          creditCardElements.forEach(element => {
            element.style.display = 'block'
          })
        } else {
          creditCardElements.forEach(element => {
            element.style.display = 'none'
          })
        }
      })
      
      // Trigger change event to set initial state
      setTimeout(() => {
        paymentMethodSelect.dispatchEvent(new Event('change'))
      }, 500)
    }
    
    // Add validation for credit card fields
    const cardNumberInput = document.getElementById('card-number')
    if (cardNumberInput) {
      cardNumberInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '')
        if (value.length > 0) {
          value = value.match(new RegExp('.{1,4}', 'g')).join(' ')
        }
        e.target.value = value
      })
    }
    
    const cardExpiryInput = document.getElementById('card-expiry')
    if (cardExpiryInput) {
      cardExpiryInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '')
        if (value.length > 2) {
          value = value.slice(0, 2) + '/' + value.slice(2)
        }
        e.target.value = value
      })
    }
  }
  
  // Generate seat map
  function generateSeatMap() {
    if (!seatMap) return
    
    seatMap.innerHTML = ''
    allSeats = []
    
    for (let i = 0; i < ROWS; i++) {
      const rowElement = document.createElement('div')
      rowElement.className = 'seat-row'
      
      // Row Label
      const rowLabel = document.createElement('div')
      rowLabel.className = 'row-label'
      rowLabel.textContent = ROW_LABELS[i]
      rowElement.appendChild(rowLabel)
      
      for (let j = 0; j < SEATS_PER_ROW; j++) {
        const seatNumber = j + 1
        const seatId = `${ROW_LABELS[i]}${seatNumber}`
        
        const seatElement = document.createElement('div')
        seatElement.className = 'seat'
        seatElement.dataset.seatId = seatId
        seatElement.textContent = seatNumber
        
        // Add aisles
        if (j === 3 || j === 8) {
          seatElement.classList.add(j === 3 ? 'aisle-right' : 'aisle-left')
        }
        
        // Determine seat type
        let seatType
        if (i < 2) {
          seatType = SEAT_TYPES.VIP
        } else if (i >= 2 && i < 5) {
          seatType = SEAT_TYPES.PREMIUM
        } else {
          seatType = SEAT_TYPES.REGULAR
        }
        
        // Make some seats accessible
        if ((i === ROWS - 1) && (j === 0 || j === SEATS_PER_ROW - 1)) {
          seatType = SEAT_TYPES.ACCESSIBLE
        }
        
        seatElement.classList.add(seatType.type)
        
        // Check if seat is occupied
        if (occupiedSeats.includes(seatId)) {
          seatElement.classList.add('occupied')
        } else {
          seatElement.addEventListener('click', () => toggleSeatSelection(seatElement, seatId, seatType))
        }
        
        allSeats.push({
          id: seatId,
          element: seatElement,
          type: seatType,
          row: ROW_LABELS[i],
          number: seatNumber
        })
        
        rowElement.appendChild(seatElement)
      }
      
      seatMap.appendChild(rowElement)
    }
  }
  
  // Toggle seat selection
  function toggleSeatSelection(seatElement, seatId, seatType) {
    if (seatElement.classList.contains('occupied')) {
      return
    }
    
    const isSelected = seatElement.classList.contains('selected')
    
    if (isSelected) {
      // Deselect the seat
      seatElement.classList.remove('selected')
      selectedSeats = selectedSeats.filter(seat => seat.id !== seatId)
    } else {
      // Select the seat
      seatElement.classList.add('selected')
      seatElement.classList.add('seat-highlight')
      setTimeout(() => {
        seatElement.classList.remove('seat-highlight')
      }, 500)
      
      selectedSeats.push({
        id: seatId,
        type: seatType,
        price: basePrice * seatType.multiplier
      })
    }
    
    updateSelectedSeatsList()
    updateTotalPrice()
    updateSeatsCount()
    
    // Enable/disable proceed button
    proceedToCheckoutBtn.disabled = selectedSeats.length === 0
  }
  
  // Update selected seats list
  function updateSelectedSeatsList() {
    if (!selectedSeatsList) return
    
    if (selectedSeats.length === 0) {
      selectedSeatsList.innerHTML = '<div class="empty-selection">Please select your seats</div>'
      return
    }
    
    selectedSeatsList.innerHTML = ''
    
    // Sort seats by row and number
    const sortedSeats = [...selectedSeats].sort((a, b) => {
      const rowA = a.id.charAt(0)
      const rowB = b.id.charAt(0)
      
      if (rowA !== rowB) {
        return rowA.localeCompare(rowB)
      }
      
      const numA = parseInt(a.id.substring(1))
      const numB = parseInt(b.id.substring(1))
      return numA - numB
    })
    
    sortedSeats.forEach(seat => {
      const seatItem = document.createElement('div')
      seatItem.className = 'selected-seat-item'
      
      const seatTypeDisplay = seat.type.type.charAt(0).toUpperCase() + seat.type.type.slice(1)
      
      seatItem.innerHTML = `
        <span class="seat-identifier">${seat.id} (${seatTypeDisplay})</span>
        <span class="seat-price">$${seat.price.toFixed(2)}</span>
      `
      
      selectedSeatsList.appendChild(seatItem)
    })
  }
  
  // Update total price
  function updateTotalPrice() {
    if (!totalPriceElement) return
    
    const total = selectedSeats.reduce((sum, seat) => sum + seat.price, 0)
    totalPriceElement.textContent = `$${total.toFixed(2)}`
  }
  
  // Update seats count
  function updateSeatsCount() {
    if (!seatsCountElement) return
    
    const count = selectedSeats.length
    seatsCountElement.textContent = `${count} seat${count !== 1 ? 's' : ''} selected`
  }
  
  // Open seat selection modal
  function openSeatSelectionModal() {
    generateSeatMap()
    updateSelectedSeatsList()
    updateTotalPrice()
    updateSeatsCount()
    
    seatSelectionModal.classList.add('active')
    
    // Update movie preview data
    if (currentMovie) {
      document.getElementById('movie-title-preview').textContent = currentMovie.title
      document.getElementById('movie-duration-preview').textContent = `${currentMovie.duration} min`
      document.getElementById('movie-genre-preview').textContent = currentMovie.genre
      document.getElementById('movie-rating-preview').textContent = currentMovie.rating
      
      // Set poster image
      const posterElement = document.getElementById('movie-poster-preview')
      if (posterElement) {
        posterElement.src = currentMovie.poster || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNTAiIGhlaWdodD0iMjI1IiBmaWxsPSIjZGRkZGRkIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjIyNSIgZmlsbD0iI2VlZWVlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ibW9ub3NwYWNlIiBmb250LXNpemU9IjE2cHgiIGZpbGw9IiM5OTk5OTkiPk5vIFBvc3RlcjwvdGV4dD48L3N2Zz4='
      }
    }
    
    // Update showtime preview data
    if (currentShowtime) {
      const startTime = new Date(currentShowtime.start_time)
      
      const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' }
      const timeOptions = { hour: 'numeric', minute: 'numeric', hour12: true }
      
      document.getElementById('showtime-date-preview').textContent = startTime.toLocaleDateString('en-US', dateOptions)
      document.getElementById('showtime-time-preview').textContent = startTime.toLocaleTimeString('en-US', timeOptions)
    }
  }
  
  // Close seat selection modal
  function closeSeatSelectionModal() {
    seatSelectionModal.classList.remove('active')
  }
  
  // Open showtime selection modal
  function openShowtimeSelectionModal() {
    if (!currentMovie) return
    
    // Update movie details
    document.getElementById('showtime-movie-title').textContent = currentMovie.title
    document.getElementById('showtime-movie-duration').textContent = `${currentMovie.duration} min`
    document.getElementById('showtime-movie-genre').textContent = currentMovie.genre
    document.getElementById('showtime-movie-rating').textContent = currentMovie.rating
    
    // Set poster image
    const posterElement = document.getElementById('showtime-movie-poster')
    if (posterElement) {
      posterElement.src = currentMovie.poster || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNTAiIGhlaWdodD0iMjI1IiBmaWxsPSIjZGRkZGRkIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjIyNSIgZmlsbD0iI2VlZWVlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ibW9ub3NwYWNlIiBmb250LXNpemU9IjE2cHgiIGZpbGw9IiM5OTk5OTkiPk5vIFBvc3RlcjwvdGV4dD48L3N2Zz4='
    }
    
    // Fetch showtimes for the movie
    fetchShowtimesForMovie(currentMovie.movie_id)
    
    showTimeSelectionModal.classList.add('active')
  }
  
  // Close showtime selection modal
  function closeShowtimeSelectionModal() {
    showTimeSelectionModal.classList.remove('active')
  }
  
  // Fetch showtimes for a movie
  async function fetchShowtimesForMovie(movieId) {
    const showtimesContainer = document.getElementById('showtimes-container')
    
    if (!showtimesContainer) return
    
    showtimesContainer.innerHTML = `
      <div class="loading-state">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Loading showtimes...</p>
      </div>
    `
    
    try {
      // Try to fetch real showtimes from API
      const url = `/api/movies/${movieId}/showtimes`
      let showtimes = []
      let useRealData = true
      
      try {
        const response = await fetch(url)
        if (response.ok) {
          showtimes = await response.json()
        } else {
          useRealData = false
          console.warn('Could not fetch real showtimes, using demo data instead')
        }
      } catch (err) {
        useRealData = false
        console.warn('API error, using demo data instead:', err)
      }
      
      // If we couldn't get real data, generate demo data
      if (!useRealData || showtimes.length === 0) {
        // Generate sample showtimes for the movie
        const today = new Date()
        
        // Create showtimes for the next 7 days
        for (let i = 0; i < 7; i++) {
          const date = new Date(today)
          date.setDate(today.getDate() + i)
          
          // Create 2-4 showtimes per day
          const numShowtimes = 2 + Math.floor(Math.random() * 3)
          
          for (let j = 0; j < numShowtimes; j++) {
            const hours = 10 + Math.floor(Math.random() * 10) // Showtimes between 10AM and 8PM
            const minutes = [0, 15, 30, 45][Math.floor(Math.random() * 4)]
            
            date.setHours(hours, minutes, 0, 0)
            
            const screen = {
              screen_id: j + 1,
              screen_name: `Screen ${j + 1}`,
              theater_id: 1,
              theater_name: 'Main Theater'
            }
            
            const endTime = new Date(date.getTime() + (currentMovie.duration * 60 * 1000))
            
            showtimes.push({
              showtime_id: i * 10 + j + 1,
              movie_id: movieId,
              screen_id: screen.screen_id,
              start_time: date.toISOString(),
              end_time: endTime.toISOString(),
              base_price: 9.99 + (j * 2), // Prices vary by time
              is_accessible: true,
              screen: screen,
              available_seats: Math.floor(Math.random() * 50) + 50
            })
          }
        }
      }
      
      if (showtimes.length === 0) {
        showtimesContainer.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-clock"></i>
            <h3>No showtimes available</h3>
            <p>There are no showtimes scheduled for this movie yet</p>
          </div>
        `
        return
      }
      
      showtimesContainer.innerHTML = ''
      
      // Sort showtimes by date and time
      showtimes.sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
      
      showtimes.forEach(showtime => {
        const showtimeCard = document.createElement('div')
        showtimeCard.className = 'showtime-card'
        showtimeCard.dataset.showtimeId = showtime.showtime_id
        
        const startTime = new Date(showtime.start_time)
        const endTime = new Date(showtime.end_time || startTime.getTime() + (currentMovie.duration * 60 * 1000))
        
        const dateOptions = { weekday: 'short', month: 'short', day: 'numeric' }
        const timeOptions = { hour: 'numeric', minute: 'numeric', hour12: true }
        
        // Get screen info - might be nested or flat object
        const screenName = showtime.screen ? showtime.screen.screen_name : `Screen ${showtime.screen_id}`
        const theaterName = showtime.screen && showtime.screen.theater_name ? 
          showtime.screen.theater_name : 'Main Theater'
        
        showtimeCard.innerHTML = `
          <div class="showtime-header">
            <div>
              <div class="showtime-time">${startTime.toLocaleTimeString('en-US', timeOptions)}</div>
              <div class="showtime-date">${startTime.toLocaleDateString('en-US', dateOptions)}</div>
            </div>
          </div>
          <div class="showtime-details">
            <div class="showtime-detail">
              <span class="showtime-label">Screen</span>
              <span class="showtime-value">${screenName}</span>
            </div>
            <div class="showtime-detail">
              <span class="showtime-label">Theater</span>
              <span class="showtime-value">${theaterName}</span>
            </div>
            <div class="showtime-detail">
              <span class="showtime-label">Available</span>
              <span class="showtime-value">${showtime.available_seats || 'Unknown'} seats</span>
            </div>
          </div>
          <div class="showtime-price">
            <span class="price-label">From</span>
            <span class="price-value">$${parseFloat(showtime.base_price).toFixed(2)}</span>
          </div>
        `
        
        showtimeCard.addEventListener('click', () => {
          // Remove selected class from all showtime cards
          document.querySelectorAll('.showtime-card').forEach(card => {
            card.classList.remove('selected')
          })
          
          // Add selected class to clicked card
          showtimeCard.classList.add('selected')
          
          // Set current showtime
          currentShowtime = showtime
          basePrice = parseFloat(showtime.base_price)
          
          // Get occupied seats - ideally from the API
          // For demo, we'll generate random occupied seats
          const numOccupied = Math.floor(Math.random() * 30) + 10
          occupiedSeats = []
          
          for (let i = 0; i < numOccupied; i++) {
            const row = ROW_LABELS[Math.floor(Math.random() * ROWS)]
            const seat = Math.floor(Math.random() * SEATS_PER_ROW) + 1
            const seatId = `${row}${seat}`
            
            if (!occupiedSeats.includes(seatId)) {
              occupiedSeats.push(seatId)
            }
          }
          
          // Clear selected seats
          selectedSeats = []
          
          // Close showtime modal and open seat selection modal
          setTimeout(() => {
            closeShowtimeSelectionModal()
            openSeatSelectionModal()
          }, 500)
        })
        
        showtimesContainer.appendChild(showtimeCard)
      })
    } catch (error) {
      console.error('Error loading showtimes:', error)
      showtimesContainer.innerHTML = `
        <div class="error-state">
          <i class="fas fa-exclamation-circle"></i>
          <h3>Error loading showtimes</h3>
          <p>${error.message || 'An unexpected error occurred'}</p>
          <button id="retry-showtimes" class="btn btn-primary">Retry</button>
        </div>
      `
      
      // Add retry button functionality
      const retryBtn = document.getElementById('retry-showtimes')
      if (retryBtn) {
        retryBtn.addEventListener('click', () => fetchShowtimesForMovie(movieId))
      }
    }
  }
  
  // Open checkout modal
  function openCheckoutModal() {
    if (selectedSeats.length === 0) {
      showNotification('Please select at least one seat', 'error')
      return
    }
    
    // Populate users dropdown
    const usersDropdown = document.getElementById('checkout-user')
    if (usersDropdown) {
      usersDropdown.innerHTML = '<option value="">Select a user</option>'
      
      // Fetch users
      fetchUsers().then(users => {
        users.forEach(user => {
          const option = document.createElement('option')
          option.value = user.users_id
          option.textContent = `${user.username} (${user.email})`
          usersDropdown.appendChild(option)
        })
      })
    }
    
    // Populate promotions dropdown
    const promotionsDropdown = document.getElementById('checkout-promotion')
    if (promotionsDropdown) {
      promotionsDropdown.innerHTML = '<option value="">No promotion</option>'
      
      // Fetch active promotions
      fetchActivePromotions().then(promotions => {
        promotions.forEach(promotion => {
          const option = document.createElement('option')
          option.value = promotion.promotion_id
          option.textContent = `${promotion.promo_code} (${promotion.discount_percentage}% off)`
          promotionsDropdown.appendChild(option)
        })
      })
    }
    
    // Update booking summary
    updateBookingSummary()
    
    // Show modal
    checkoutModal.classList.add('active')
  }
  
  // Close checkout modal
  function closeCheckoutModal() {
    checkoutModal.classList.remove('active')
  }
  
  // Update booking summary
  function updateBookingSummary() {
    if (!currentMovie || !currentShowtime) return
    
    // Movie title
    document.getElementById('summary-movie').textContent = currentMovie.title
    
    // Showtime
    const startTime = new Date(currentShowtime.start_time)
    const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' }
    const timeOptions = { hour: 'numeric', minute: 'numeric', hour12: true }
    document.getElementById('summary-showtime').textContent = 
      `${startTime.toLocaleDateString('en-US', dateOptions)} ${startTime.toLocaleTimeString('en-US', timeOptions)}`
    
    // Seats
    const seatsList = selectedSeats.map(seat => seat.id).sort().join(', ')
    document.getElementById('summary-seats').textContent = seatsList
    
    // Subtotal
    const subtotal = selectedSeats.reduce((sum, seat) => sum + seat.price, 0)
    document.getElementById('summary-subtotal').textContent = `$${subtotal.toFixed(2)}`
    
    // Check for promotion
    const promotionDropdown = document.getElementById('checkout-promotion')
    if (promotionDropdown && promotionDropdown.value) {
      // Apply promotion discount
      const promotion = activePromotions.find(p => p.promotion_id == promotionDropdown.value)
      
      if (promotion) {
        const discountAmount = subtotal * (promotion.discount_percentage / 100)
        const discountElement = document.getElementById('summary-discount')
        const discountRow = document.getElementById('discount-row')
        
        if (discountElement && discountRow) {
          discountElement.textContent = `-$${discountAmount.toFixed(2)}`
          discountRow.style.display = 'flex'
          
          const total = subtotal - discountAmount
          document.getElementById('summary-total').textContent = `$${total.toFixed(2)}`
          return
        }
      }
    }
    
    // No promotion applied
    document.getElementById('discount-row').style.display = 'none'
    document.getElementById('summary-total').textContent = `$${subtotal.toFixed(2)}`
  }
  
  // Handle promotion change
  function handlePromotionChange() {
    updateBookingSummary()
  }
  
  // Fetch users
  async function fetchUsers() {
    // In a real app, this would be an API call
    // For demo, we'll return sample data
    return [
      { users_id: 1, username: 'johndoe', email: 'john@example.com', phone_number: '555-1111' },
      { users_id: 2, username: 'janedoe', email: 'jane@example.com', phone_number: '555-2222' },
      { users_id: 3, username: 'bobsmith', email: 'bob@example.com', phone_number: '555-3333' }
    ]
  }
  
  // Active promotions
  let activePromotions = []
  
  // Fetch active promotions
  async function fetchActivePromotions() {
    // In a real app, this would be an API call
    // For demo, we'll return sample data
    activePromotions = [
      { promotion_id: 1, promo_code: 'SUMMER2025', discount_percentage: 15, start_date: '2025-06-01', end_date: '2025-08-31' },
      { promotion_id: 2, promo_code: 'WELCOME10', discount_percentage: 10, start_date: '2025-01-01', end_date: '2025-12-31' }
    ]
    
    return activePromotions
  }
  
  // Handle complete booking
  async function handleCompleteBooking() {
    const userDropdown = document.getElementById('checkout-user')
    const promotionDropdown = document.getElementById('checkout-promotion')
    const paymentDropdown = document.getElementById('checkout-payment')
    
    if (!userDropdown || !userDropdown.value) {
      showNotification('Please select a user', 'error')
      return
    }
    
    if (!currentShowtime || !currentMovie || selectedSeats.length === 0) {
      showNotification('Invalid booking data', 'error')
      return
    }
    
    // Validate payment information if credit/debit card is selected
    if (paymentDropdown.value === 'CREDIT_CARD' || paymentDropdown.value === 'DEBIT_CARD') {
      const cardNumber = document.getElementById('card-number').value.replace(/\s/g, '')
      const cardExpiry = document.getElementById('card-expiry').value
      const cardCvv = document.getElementById('card-cvv').value
      const cardName = document.getElementById('card-name').value
      
      if (!cardNumber || cardNumber.length < 15) {
        showNotification('Please enter a valid card number', 'error')
        return
      }
      
      if (!cardExpiry || !cardExpiry.includes('/')) {
        showNotification('Please enter a valid expiry date (MM/YY)', 'error')
        return
      }
      
      if (!cardCvv || cardCvv.length < 3) {
        showNotification('Please enter a valid CVV code', 'error')
        return
      }
      
      if (!cardName) {
        showNotification('Please enter the name on your card', 'error')
        return
      }
    }
    
    // Create booking data
    const bookingData = {
      users_id: parseInt(userDropdown.value),
      promotion_id: promotionDropdown.value ? parseInt(promotionDropdown.value) : null,
      booking_status: 'CONFIRMED',
      tickets: selectedSeats.map(seat => ({
        showtime_id: currentShowtime.showtime_id,
        seat_id: getSeatIdFromSeatCode(seat.id),
        ticket_status: 'ACTIVE',
        ticket_code: generateTicketCode(),
        ticket_type_id: getTicketTypeIdFromSeatType(seat.type.type)
      }))
    }
    
    try {
      // Create a real booking in the database
      showNotification('Processing your booking...', 'info');
      
      console.log('Sending booking data:', JSON.stringify(bookingData, null, 2));
      
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server returned error:', errorData);
        throw new Error(errorData.message || 'Failed to create booking');
      }
      
      const bookingResult = await response.json();
      const bookingId = bookingResult.booking_id;
      
      console.log('Booking created successfully with ID:', bookingId);
      
      // Close checkout modal
      closeCheckoutModal();
      
      // Show confirmation modal
      showBookingConfirmation(bookingId, bookingData);
      
    } catch (error) {
      console.error('Error creating booking:', error);
      
      // Get more detailed error message if available
      let errorMessage = error.message;
      if (errorMessage.includes('Failed to fetch')) {
        errorMessage = 'Server connection error. Please check your internet connection and try again.';
      }
      
      showNotification('Failed to complete booking: ' + errorMessage, 'error');
    }
  }
  
  // Show booking confirmation
  function showBookingConfirmation(bookingId, bookingData) {
    // Set confirmation data
    document.getElementById('confirmation-booking-id').textContent = `Booking #${bookingId}`
    document.getElementById('confirmation-movie').textContent = currentMovie.title
    
    const startTime = new Date(currentShowtime.start_time)
    const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' }
    const timeOptions = { hour: 'numeric', minute: 'numeric', hour12: true }
    
    document.getElementById('confirmation-datetime').textContent = 
      `${startTime.toLocaleDateString('en-US', dateOptions)} ${startTime.toLocaleTimeString('en-US', timeOptions)}`
    
    document.getElementById('confirmation-cinema').textContent = 'CineWorld' // In a real app, this would come from the cinema data
    document.getElementById('confirmation-screen').textContent = `Screen ${currentShowtime.screen.screen_id}`
    
    const seatsList = selectedSeats.map(seat => seat.id).sort().join(', ')
    document.getElementById('confirmation-seats').textContent = seatsList
    
    document.getElementById('confirmation-code').textContent = bookingData.tickets[0].ticket_code
    
    // Show confirmation modal
    bookingConfirmationModal.classList.add('active')
    
    // Reset booking data
    selectedSeats = []
    currentShowtime = null
    basePrice = 0
    selectedPromotion = null
    
    // Find the bookings tab and switch to it after a delay
    setTimeout(() => {
      // Switch to the bookings tab
      const bookingTab = document.querySelector('.tab-btn[data-tab="bookings"]');
      if (bookingTab) {
        bookingTab.click();
      }
      
      // Refresh the bookings data
      if (typeof window.fetchBookings === 'function') {
        window.fetchBookings();
      }
      
      // Close the confirmation modal after switching tabs
      setTimeout(() => {
        closeBookingConfirmationModal();
      }, 1000);
    }, 3000); // Wait 3 seconds to show the confirmation before switching tabs
    
    showNotification('Booking completed successfully!', 'success')
  }
  
  // Close booking confirmation modal
  function closeBookingConfirmationModal() {
    bookingConfirmationModal.classList.remove('active')
  }
  
  // Print ticket
  function printTicket() {
    // In a real app, this would open a print dialog for the ticket
    window.print()
  }
  
  // Helper functions
  function getSeatIdFromSeatCode(seatCode) {
    // In a real app, this would query the database for a seat ID
    // For our implementation, we'll pass the seat code directly to the API
    // The backend has been updated to handle seat codes directly
    return seatCode
  }
  
  function getTicketTypeIdFromSeatType(seatType) {
    // Map seat type to ticket type ID
    const ticketTypeMap = {
      'regular': 1,
      'premium': 3,
      'vip': 2,
      'accessible': 1
    }
    
    return ticketTypeMap[seatType] || 1
  }
  
  function generateTicketCode() {
    // Generate a random ticket code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = 'TKT'
    
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    
    return code
  }
  
  // Show notification
  function showNotification(message, type = 'success') {
    // Log to console
    console.log(`SEAT SELECTION (${type}): ${message}`);
    
    // Create a direct notification if container exists
    const notificationContainer = document.querySelector('.notification-container');
    if (notificationContainer) {
      const notification = document.createElement('div');
      notification.className = `notification notification-${type}`;
      
      notification.innerHTML = `
        <div class="notification-content">
          <span class="notification-icon">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'info' ? 'info-circle' : 'exclamation-circle'}"></i>
          </span>
          <span>${message}</span>
        </div>
        <button class="notification-close">&times;</button>
      `;
      
      notificationContainer.appendChild(notification);
      
      const closeButton = notification.querySelector('.notification-close');
      closeButton.addEventListener('click', () => {
        notification.classList.add('fade-out');
        setTimeout(() => {
          notification.remove();
        }, 500);
      });
      
      setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
          notification.remove();
        }, 500);
      }, 3000);
    }
  }
  
  // Public API
  window.SeatSelection = {
    init: function() {
      initEventListeners()
    },
    
    openShowtimeSelectionForMovie: function(movie) {
      currentMovie = movie
      openShowtimeSelectionModal()
    }
  }
  
  // Initialize when the page loads
  document.addEventListener('DOMContentLoaded', function() {
    if (window.SeatSelection) {
      window.SeatSelection.init()
    }
  })
})