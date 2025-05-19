# CineTicket System QA Test Plan

## 1. Initial Setup
- Verify database connection
- Confirm all tables have been created
- Check sample data is properly loaded

## 2. Movie Management
- **Create Movie Test**
  - Fill all fields in the Add Movie form
  - Upload a poster image
  - Save and verify movie appears in list
- **Edit Movie Test**
  - Select an existing movie
  - Modify fields (title, genre, rating, etc.)
  - Save and verify changes
- **Delete Movie Test**
  - Select a movie without related bookings
  - Delete and verify it's removed
  - Try to delete a movie with bookings (should show warning)

## 3. Cinema Management
- **Create Cinema Test**
  - Fill all fields in Add Cinema form
  - Save and verify cinema appears in list
- **Edit Cinema Test**
  - Select existing cinema
  - Modify details
  - Save and verify changes
- **Delete Cinema Test**
  - Select a cinema without associated theaters
  - Delete and verify removal

## 4. Booking Management
- **View Bookings Test**
  - Verify all bookings are displayed correctly
  - Check that booking statuses are accurate
- **Edit Booking Test**
  - Select a booking
  - Change status
  - Apply a promotion
  - Save and verify changes
- **Delete Booking Test**
  - Select a booking
  - Delete and verify removal
  - Check that related tickets are also removed

## 5. User Management
- **Create User Test**
  - Fill all fields in Add User form
  - Save and verify user appears in list
- **Edit User Test**
  - Select existing user
  - Modify details
  - Save and verify changes
- **Delete User Test**
  - Select a user without bookings
  - Delete and verify removal
  - Try to delete a user with bookings (should show warning)

## 6. Reports
- **Generate Report Test**
  - Set date range
  - Generate report
  - Verify statistics match expected data

## 7. UI/UX Testing
- **Responsive Design**
  - Test on different screen sizes
  - Verify all elements remain functional and accessible
- **Modal Functionality**
  - Check all modals open and close correctly
  - Verify form validation works
- **Search & Filter**
  - Test search functionality with various queries
  - Verify filters work correctly for all content types

## 8. Seat Selection Testing
- **Theater Visualization**
  - Verify seat map correctly displays for a showtime
  - Check that seat types are displayed distinctly
- **Seat Selection**
  - Select and deselect multiple seats
  - Verify seat status updates in real-time
  - Check price calculation accuracy
- **Booking Flow**
  - Complete a booking with selected seats
  - Verify ticket creation with correct seat assignments

## 9. Integration Testing
- **Movie -> Showtime -> Seat -> Booking Flow**
  - Test the complete booking flow from movie selection to ticket generation
- **Promotion Application**
  - Apply promotions to bookings
  - Verify discount calculations

## 10. Performance Testing
- **Load Testing**
  - Test with large dataset (100+ movies, cinemas, users)
  - Verify response times remain acceptable
- **Concurrent Users**
  - Simulate multiple users making bookings simultaneously
  - Check for race conditions

## Bug Reporting Template

```
Bug ID: [Unique ID]
Title: [Brief description]
Severity: [Critical/High/Medium/Low]
Steps to Reproduce:
1. 
2. 
3. 

Expected Result:
Actual Result:
Screenshots/Logs:
Additional Notes:
```