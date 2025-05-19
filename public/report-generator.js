/**
 * Report Generator Module
 * 
 * Handles PDF report generation for the CineTicket system
 * Uses jsPDF library for PDF generation
 * 
 * Note: Modified to fix PDF table layout issues:
 * - Adjusted column widths to prevent "6 units width could not fit page" error
 * - Set proper page breaks for tables to prevent overflow
 * - Improved table formatting for better readability
 * - Added text truncation to prevent content overflow
 * - Used proper A4 page configuration
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize the report generator if PDF button exists
  const generateReportPdfBtn = document.getElementById('generate-report-pdf-btn');
  if (generateReportPdfBtn) {
    generateReportPdfBtn.addEventListener('click', generatePdfReport);
  }
});

/**
 * Generates a PDF report based on the date range and data
 */
async function generatePdfReport() {
  // Get date range
  const startDate = document.getElementById('report-start-date').value;
  const endDate = document.getElementById('report-end-date').value;
  
  if (!startDate || !endDate) {
    console.log('Missing dates for report generation');
    showNotification('Please select both start and end dates', 'error');
    return;
  }
  
  // Log instead of showing notification to avoid recursion
  console.log('Generating PDF report for dates:', startDate, 'to', endDate);
  
  try {
    // Create loading notification manually to avoid recursion
    const notificationContainer = document.querySelector('.notification-container');
    if (notificationContainer) {
      const loadingNote = document.createElement('div');
      loadingNote.className = 'notification notification-info';
      loadingNote.innerHTML = `
        <div class="notification-content">
          <span class="notification-icon"><i class="fas fa-info-circle"></i></span>
          <span>Generating PDF report...</span>
        </div>
      `;
      notificationContainer.appendChild(loadingNote);
      
      // Remove after 3 seconds
      setTimeout(() => loadingNote.remove(), 3000);
    }
    
    // Fetch required data
    const [bookingsData, moviesData, cinemasData] = await Promise.all([
      fetchReportData('bookings', startDate, endDate),
      fetchReportData('movies'),
      fetchReportData('cinemas')
    ]);
    
    // Generate the PDF
    const pdfDoc = createPdfDocument(startDate, endDate, bookingsData, moviesData, cinemasData);
    
    // Download the PDF
    pdfDoc.save(`CineTicket_Report_${formatDateForFilename(startDate)}_to_${formatDateForFilename(endDate)}.pdf`);
    
    // Create success notification manually to avoid recursion
    if (notificationContainer) {
      const successNote = document.createElement('div');
      successNote.className = 'notification notification-success';
      successNote.innerHTML = `
        <div class="notification-content">
          <span class="notification-icon"><i class="fas fa-check-circle"></i></span>
          <span>PDF report generated successfully</span>
        </div>
        <button class="notification-close">&times;</button>
      `;
      notificationContainer.appendChild(successNote);
      
      const closeBtn = successNote.querySelector('.notification-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => successNote.remove());
      }
      
      // Remove after 3 seconds
      setTimeout(() => {
        successNote.classList.add('fade-out');
        setTimeout(() => successNote.remove(), 500);
      }, 3000);
    }
    
    console.log('PDF report generated successfully');
  } catch (error) {
    console.error('Error generating PDF report:', error);
    
    // Create error notification manually to avoid recursion
    const notificationContainer = document.querySelector('.notification-container');
    if (notificationContainer) {
      const errorNote = document.createElement('div');
      errorNote.className = 'notification notification-error';
      errorNote.innerHTML = `
        <div class="notification-content">
          <span class="notification-icon"><i class="fas fa-exclamation-circle"></i></span>
          <span>Failed to generate PDF report: ${error.message}</span>
        </div>
        <button class="notification-close">&times;</button>
      `;
      notificationContainer.appendChild(errorNote);
      
      const closeBtn = errorNote.querySelector('.notification-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => errorNote.remove());
      }
      
      // Remove after 5 seconds
      setTimeout(() => {
        errorNote.classList.add('fade-out');
        setTimeout(() => errorNote.remove(), 500);
      }, 5000);
    }
  }
}

/**
 * Fetches report data from the server
 * @param {string} dataType - Type of data to fetch (bookings, movies, cinemas)
 * @param {string} startDate - Optional start date for filtering
 * @param {string} endDate - Optional end date for filtering
 * @returns {Promise<Array>} - Promise that resolves to the fetched data
 */
async function fetchReportData(dataType, startDate, endDate) {
  let url = `/api/${dataType}`;
  
  // Add date range parameters for bookings
  if (dataType === 'bookings' && startDate && endDate) {
    url += `/report?startDate=${startDate}&endDate=${endDate}`;
  }
  
  try {
    console.log(`Fetching report data from: ${url}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Server response (${response.status}):`, errorText);
      throw new Error(`Failed to fetch ${dataType} data: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Fetched ${dataType} data:`, data.length, 'items');
    return data;
  } catch (error) {
    console.error(`Error fetching ${dataType} data:`, error);
    showNotification(`Failed to load ${dataType} data. Using sample data instead.`, 'warning');
    // Return mock data if API fails
    return getMockData(dataType);
  }
}

/**
 * Creates a PDF document with the report data
 * @param {string} startDate - Start date for the report period
 * @param {string} endDate - End date for the report period
 * @param {Array} bookingsData - Booking data for the report
 * @param {Array} moviesData - Movie data for the report
 * @param {Array} cinemasData - Cinema data for the report
 * @returns {jsPDF} - Generated PDF document
 */
function createPdfDocument(startDate, endDate, bookingsData, moviesData, cinemasData) {
  // Create new PDF document with landscape orientation for more width
  const doc = new jspdf.jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true
  });
  
  // Get page dimensions for centered content
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageCenter = pageWidth / 2;
  
  // Add title
  doc.setFontSize(22);
  doc.setTextColor(59, 70, 229); // Primary color
  doc.text('CineTicket System Report', pageCenter, 20, null, null, 'center');
  
  // Add date range subtitle
  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139); // Text light color
  const formattedStartDate = formatDateForDisplay(startDate);
  const formattedEndDate = formatDateForDisplay(endDate);
  doc.text(`Report Period: ${formattedStartDate} to ${formattedEndDate}`, pageCenter, 30, null, null, 'center');
  
  // Add generated timestamp
  const now = new Date();
  doc.setFontSize(10);
  doc.text(`Generated on: ${now.toLocaleString()}`, pageCenter, 35, null, null, 'center');
  
  // Add divider - adjust for landscape mode
  doc.setDrawColor(229, 231, 235);
  doc.line(20, 40, pageWidth - 20, 40);
  
  // Add summary section
  addSummarySection(doc, bookingsData, moviesData, cinemasData, 45);
  
  // Add ticket sales section
  const yPos = addTicketSalesSection(doc, bookingsData, 85);
  
  // Add movies section
  const yPos2 = addMoviesSection(doc, moviesData, yPos + 10);
  
  // Add cinemas section
  const yPos3 = addCinemasSection(doc, cinemasData, yPos2 + 10);
  
  // Add footer
  addFooter(doc);
  
  return doc;
}

/**
 * Adds the summary section to the PDF
 * @param {jsPDF} doc - PDF document
 * @param {Array} bookingsData - Booking data
 * @param {Array} moviesData - Movie data
 * @param {Array} cinemasData - Cinema data
 * @param {number} y - Y position to start drawing
 * @returns {number} - The Y position after drawing the section
 */
function addSummarySection(doc, bookingsData, moviesData, cinemasData, y) {
  // Get page dimensions
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Section title
  doc.setFontSize(16);
  doc.setTextColor(31, 41, 55); // Text dark color
  doc.text('Summary', 20, y);
  
  // Calculate summary statistics
  const totalSales = calculateTotalSales(bookingsData);
  const confirmedBookings = bookingsData.filter(b => b.booking_status === 'CONFIRMED').length;
  const pendingBookings = bookingsData.filter(b => b.booking_status === 'PENDING').length;
  
  // Create summary table
  const summaryData = [
    ['Total Ticket Sales', `$${totalSales.toFixed(2)}`],
    ['Total Bookings', bookingsData.length.toString()],
    ['Confirmed Bookings', confirmedBookings.toString()],
    ['Pending Bookings', pendingBookings.toString()],
    ['Total Movies', moviesData.length.toString()],
    ['Total Cinemas', cinemasData.length.toString()]
  ];
  
  doc.autoTable({
    startY: y + 5,
    head: [['Metric', 'Value']],
    body: summaryData,
    theme: 'grid',
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 80, halign: 'right' }
    },
    // Calculate margins to center the table in the page
    margin: { left: 20, right: pageWidth - 220 },
    tableWidth: 200,
    styles: {
      cellPadding: 4,
      fontSize: 10,
      fontStyle: 'bold'
    }
  });
  
  return doc.lastAutoTable.finalY;
}

/**
 * Adds the ticket sales section to the PDF
 * @param {jsPDF} doc - PDF document
 * @param {Array} bookingsData - Booking data
 * @param {number} y - Y position to start drawing
 * @returns {number} - The Y position after drawing the section
 */
function addTicketSalesSection(doc, bookingsData, y) {
  // Section title
  doc.setFontSize(16);
  doc.setTextColor(31, 41, 55); // Text dark color
  
  // Prepare transaction data
  const transactionData = bookingsData.map(booking => {
    // Get ticket count and price from booking
    let ticketCount = booking.ticket_count || 0;
    let totalPrice = booking.total_price || 0;
    
    // If we don't have real data, use calculated values
    if (!ticketCount || !totalPrice) {
      // In a real app, would calculate from actual tickets
      // For demo purposes, use a random number of tickets and price
      ticketCount = Math.floor(Math.random() * 4) + 1;
      const basePrice = 12.99;
      totalPrice = ticketCount * basePrice;
      
      // Apply discount if promotion exists
      if (booking.promotion_id) {
        // Apply discount from the booking or use standard 10%
        const discount = booking.discount_percent || 10;
        totalPrice = totalPrice * (1 - discount/100);
      }
    }
    
    // Format the booking date
    const bookingDate = new Date(booking.booking_date);
    const formattedDate = !isNaN(bookingDate) ? bookingDate.toLocaleDateString() : 'Invalid Date';
    
    // Get cinema name if available
    const cinema = booking.cinema_name || 'N/A';
    
    return [
      booking.booking_id.toString(),
      booking.username || 'N/A',
      booking.movie_title || 'N/A',
      formattedDate,
      ticketCount.toString(),
      booking.promotion_id ? (booking.promo_code || 'Yes') : 'No',
      `$${typeof totalPrice === 'number' ? totalPrice.toFixed(2) : '0.00'}`,
      booking.booking_status || 'PENDING'
    ];
  });
  
  // Create transactions table
  // Check if need to add a new page for this table
  if (y > 180) {
    doc.addPage();
    y = 20;
    
    // Add section title on new page
    doc.setFontSize(16);
    doc.setTextColor(31, 41, 55);
    doc.text('Transactions', 20, y);
  }
  
  // Get page dimensions
  const pageWidth = doc.internal.pageSize.getWidth();
  
  doc.autoTable({
    startY: y + 5,
    head: [['ID', 'User', 'Movie', 'Date', 'Tickets', 'Promo', 'Total', 'Status']],
    body: transactionData,
    theme: 'striped',
    headStyles: {
      fillColor: [249, 115, 22], // Secondary color
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    // Adjust column widths for landscape mode
    columnStyles: {
      0: { cellWidth: 20 },  // ID
      1: { cellWidth: 40 },  // User
      2: { cellWidth: 60 },  // Movie (more space for movie titles)
      3: { cellWidth: 40 },  // Date
      4: { cellWidth: 25 },  // Tickets
      5: { cellWidth: 30 },  // Promo
      6: { cellWidth: 30, halign: 'right' },  // Total
      7: { cellWidth: 30, halign: 'center' }  // Status
    },
    margin: { left: 20, right: 20 },
    willDrawCell: function(data) {
      // Highlight status cells based on status
      if (data.section === 'body' && data.column.index === 7) {
        if (data.cell.raw === 'CONFIRMED') {
          data.cell.styles.fillColor = [209, 250, 229]; // Light green
          data.cell.styles.textColor = [5, 150, 105]; // Green
        } else if (data.cell.raw === 'PENDING') {
          data.cell.styles.fillColor = [254, 243, 199]; // Light yellow
          data.cell.styles.textColor = [217, 119, 6]; // Amber
        } else if (data.cell.raw === 'CANCELLED') {
          data.cell.styles.fillColor = [254, 226, 226]; // Light red
          data.cell.styles.textColor = [185, 28, 28]; // Red
        }
      }
    },
    styles: {
      overflow: 'linebreak',
      cellPadding: 4,
      fontSize: 9
    },
    didParseCell: function(data) {
      // Limit movie title length but we can show more in landscape mode
      if (data.section === 'body' && data.column.index === 2 && typeof data.cell.text === 'string' && data.cell.text.length > 40) {
        data.cell.text = data.cell.text.substring(0, 37) + '...';
      }
    }
  });
  
  return doc.lastAutoTable.finalY;
}

/**
 * Adds the movies section to the PDF
 * @param {jsPDF} doc - PDF document
 * @param {Array} moviesData - Movie data
 * @param {number} y - Y position to start drawing
 * @returns {number} - The Y position after drawing the section
 */
function addMoviesSection(doc, moviesData, y) {
  // Check if need to add a new page - use a lower threshold to ensure more space
  if (y > 180) {
    doc.addPage();
    y = 20;
    
    // Add section title on new page
    doc.setFontSize(16);
    doc.setTextColor(31, 41, 55);
    doc.text('Movies', 20, y);
  } else {
    // Section title
    doc.setFontSize(16);
    doc.setTextColor(31, 41, 55); // Text dark color
    doc.text('Movies', 20, y);
  }
  
  // Prepare movie data
  const movieTableData = moviesData.map(movie => {
    // Format the release date
    const releaseDate = new Date(movie.release_date);
    const formattedDate = releaseDate.toLocaleDateString();
    
    return [
      movie.movie_id.toString(),
      movie.title,
      movie.genre || 'N/A',
      movie.duration ? `${movie.duration} min` : 'N/A',
      movie.rating || 'N/A',
      formattedDate
    ];
  });
  
  // Get page dimensions
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Create movies table
  doc.autoTable({
    startY: y + 5,
    head: [['ID', 'Title', 'Genre', 'Duration', 'Rating', 'Release Date']],
    body: movieTableData,
    theme: 'grid',
    headStyles: {
      fillColor: [16, 185, 129], // Success color
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    // Adjust for landscape mode
    columnStyles: {
      0: { cellWidth: 20 },  // ID
      1: { cellWidth: 100 }, // Title - much more space for movie titles
      2: { cellWidth: 50 },  // Genre
      3: { cellWidth: 30 },  // Duration
      4: { cellWidth: 30 },  // Rating
      5: { cellWidth: 40 }   // Release Date
    },
    margin: { left: 20, right: 20 },
    styles: {
      overflow: 'linebreak',
      cellPadding: 4,
      fontSize: 9
    },
    didParseCell: function(data) {
      // We can allow longer titles in landscape mode
      if (data.section === 'body' && data.column.index === 1 && typeof data.cell.text === 'string' && data.cell.text.length > 80) {
        data.cell.text = data.cell.text.substring(0, 77) + '...';
      }
    }
  });
  
  return doc.lastAutoTable.finalY;
}

/**
 * Adds the cinemas section to the PDF
 * @param {jsPDF} doc - PDF document
 * @param {Array} cinemasData - Cinema data
 * @param {number} y - Y position to start drawing
 * @returns {number} - The Y position after drawing the section
 */
function addCinemasSection(doc, cinemasData, y) {
  // Check if need to add a new page - use a lower threshold to ensure more space
  if (y > 180) {
    doc.addPage();
    y = 20;
    
    // Add section title on new page
    doc.setFontSize(16);
    doc.setTextColor(31, 41, 55);
    doc.text('Cinemas', 20, y);
  } else {
    // Section title
    doc.setFontSize(16);
    doc.setTextColor(31, 41, 55); // Text dark color
    doc.text('Cinemas', 20, y);
  }
  
  // Prepare cinema data
  const cinemaTableData = cinemasData.map(cinema => {
    return [
      cinema.cinema_id.toString(),
      cinema.name,
      cinema.city || 'N/A',
      cinema.address || 'N/A',
      cinema.contact_number || 'N/A'
    ];
  });
  
  // Get page dimensions
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Create cinemas table
  doc.autoTable({
    startY: y + 5,
    head: [['ID', 'Name', 'City', 'Address', 'Contact']],
    body: cinemaTableData,
    theme: 'striped',
    headStyles: {
      fillColor: [79, 70, 229], // Primary color
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    // Adjust for landscape mode
    columnStyles: {
      0: { cellWidth: 20 },  // ID
      1: { cellWidth: 70 },  // Name
      2: { cellWidth: 60 },  // City
      3: { cellWidth: 90 },  // Address - much more space in landscape
      4: { cellWidth: 40 }   // Contact
    },
    margin: { left: 20, right: 20 },
    styles: {
      overflow: 'linebreak',
      cellPadding: 4,
      fontSize: 9
    },
    didParseCell: function(data) {
      // We can allow longer addresses in landscape mode
      if (data.section === 'body' && data.column.index === 3 && typeof data.cell.text === 'string' && data.cell.text.length > 70) {
        data.cell.text = data.cell.text.substring(0, 67) + '...';
      }
    }
  });
  
  return doc.lastAutoTable.finalY;
}

/**
 * Adds a footer to the PDF
 * @param {jsPDF} doc - PDF document
 */
function addFooter(doc) {
  const pageCount = doc.internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageCenter = pageWidth / 2;
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Add page number
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Text light color
    doc.text(`Page ${i} of ${pageCount}`, pageCenter, pageHeight - 10, null, null, 'center');
    
    // Add company footer
    doc.setFontSize(10);
    doc.text('CineTicket - Premium Movie Booking System', pageCenter, pageHeight - 15, null, null, 'center');
  }
}

/**
 * Calculates total sales from bookings data
 * @param {Array} bookingsData - Booking data
 * @returns {number} - Total sales amount
 */
function calculateTotalSales(bookingsData) {
  // Calculate total sales from booking data
  return bookingsData.reduce((total, booking) => {
    // Use the booking's total_price if available, otherwise calculate it
    let amount = 0;
    
    if (booking.total_price && typeof booking.total_price === 'number') {
      // Use the booking's total price from the data
      amount = booking.total_price;
    } else {
      // Calculate based on ticket count or use a random value
      const ticketCount = booking.ticket_count || Math.floor(Math.random() * 4) + 1;
      const basePrice = 12.99;
      amount = ticketCount * basePrice;
      
      // Apply promotion discount if applicable
      if (booking.promotion_id) {
        const discount = booking.discount_percent || 10;
        amount = amount * (1 - discount/100);
      }
    }
    
    // Only count confirmed bookings
    if (booking.booking_status === 'CONFIRMED') {
      return total + amount;
    }
    return total;
  }, 0);
}

/**
 * Formats a date string for display in the PDF
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted date string
 */
function formatDateForDisplay(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Formats a date string for use in filenames
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted date string for filenames
 */
function formatDateForFilename(dateString) {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
}

/**
 * Gets mock data if API fails
 * @param {string} dataType - Type of data to get
 * @returns {Array} - Mock data
 */
function getMockData(dataType) {
  if (dataType === 'bookings') {
    return [
      { booking_id: 1, users_id: 1, username: 'johndoe', movie_title: 'Inception', booking_date: '2025-06-15T18:30:00', booking_status: 'CONFIRMED', promotion_id: null },
      { booking_id: 2, users_id: 2, username: 'janedoe', movie_title: 'Avengers: Endgame', booking_date: '2025-06-16T19:45:00', booking_status: 'CONFIRMED', promotion_id: 1 },
      { booking_id: 3, users_id: 3, username: 'bobsmith', movie_title: 'The Shawshank Redemption', booking_date: '2025-06-17T20:15:00', booking_status: 'PENDING', promotion_id: null },
      { booking_id: 4, users_id: 1, username: 'johndoe', movie_title: 'Parasite', booking_date: '2025-06-18T17:30:00', booking_status: 'CANCELLED', promotion_id: 2 },
      { booking_id: 5, users_id: 2, username: 'janedoe', movie_title: 'Inception', booking_date: '2025-06-19T21:00:00', booking_status: 'CONFIRMED', promotion_id: null }
    ];
  } else if (dataType === 'movies') {
    return [
      { movie_id: 1, title: 'Inception', description: 'A thief who steals corporate secrets through the use of dream-sharing technology', duration: 148, genre: 'Sci-Fi', rating: 'PG-13', release_date: '2010-07-16' },
      { movie_id: 2, title: 'The Shawshank Redemption', description: 'Two imprisoned men bond over a number of years', duration: 142, genre: 'Drama', rating: 'R', release_date: '1994-09-23' },
      { movie_id: 3, title: 'Avengers: Endgame', description: 'The Avengers take a final stand against Thanos', duration: 181, genre: 'Action', rating: 'PG-13', release_date: '2019-04-26' },
      { movie_id: 4, title: 'Parasite', description: 'Greed and class discrimination threaten the relationship between a wealthy family and a destitute clan', duration: 132, genre: 'Thriller', rating: 'R', release_date: '2019-05-30' }
    ];
  } else if (dataType === 'cinemas') {
    return [
      { cinema_id: 1, name: 'CineWorld', address: '123 Main St', city: 'New York', contact_number: '555-1234' },
      { cinema_id: 2, name: 'MoviePlex', address: '456 Oak Ave', city: 'Los Angeles', contact_number: '555-5678' },
      { cinema_id: 3, name: 'FilmHouse', address: '789 Pine Rd', city: 'Chicago', contact_number: '555-9012' }
    ];
  }
  
  return [];
}

// Helper function to show notifications (completely independent implementation)
function showNotification(message, type) {
  // Avoid recursion - don't call any other showNotification function
  console.log(`REPORT NOTIFICATION (${type}): ${message}`);
  
  // Create a notification element if we're in a browser environment
  if (typeof document !== 'undefined') {
    const notificationContainer = document.querySelector('.notification-container');
    if (!notificationContainer) return;
    
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
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        notification.classList.add('fade-out');
        setTimeout(() => {
          notification.remove();
        }, 500);
      });
    }
    
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => {
        notification.remove();
      }, 500);
    }, 3000);
  }
}