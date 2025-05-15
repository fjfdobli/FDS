CREATE DATABASE MovieTicketBookingDB;
USE MovieTicketBookingDB;

CREATE TABLE Cinema (
    cinema_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255),
    city VARCHAR(100),
    contact_number VARCHAR(20)
);

CREATE TABLE Theater (
    theater_id INT AUTO_INCREMENT PRIMARY KEY,
    cinema_id INT NOT NULL,
    theater_name VARCHAR(100) NOT NULL,
    theater_type VARCHAR(50),
    capacity INT,
    FOREIGN KEY (cinema_id) REFERENCES Cinema(cinema_id) ON DELETE CASCADE
);

CREATE TABLE Screen (
    screen_id INT AUTO_INCREMENT PRIMARY KEY,
    theater_id INT NOT NULL,
    screen_name VARCHAR(100) NOT NULL,
    total_seats INT,
    screen_type VARCHAR(50),
    FOREIGN KEY (theater_id) REFERENCES Theater(theater_id) ON DELETE CASCADE
);

CREATE TABLE Seat (
    seat_id INT AUTO_INCREMENT PRIMARY KEY,
    screen_id INT NOT NULL,
    seat_number VARCHAR(10),
    seat_row VARCHAR(10),
    seat_type VARCHAR(50),
    price_multiplier DECIMAL(3,2) DEFAULT 1.00,
    is_accessible BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (screen_id) REFERENCES Screen(screen_id) ON DELETE CASCADE
);

CREATE TABLE Movie (
    movie_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration INT,
    genre VARCHAR(100),
    rating VARCHAR(10),
    release_date DATE,
    poster VARCHAR(255)
);

CREATE TABLE User (
    users_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    registration_date DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Promotion (
    promotion_id INT AUTO_INCREMENT PRIMARY KEY,
    promo_code VARCHAR(50) NOT NULL UNIQUE,
    discount_percentage DECIMAL(5,2) NOT NULL,
    start_date DATETIME,
    end_date DATETIME
);

CREATE TABLE Booking (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    users_id INT NOT NULL,
    booking_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    booking_status VARCHAR(50) DEFAULT 'PENDING',
    promotion_id INT,
    FOREIGN KEY (users_id) REFERENCES User(users_id) ON DELETE CASCADE,
    FOREIGN KEY (promotion_id) REFERENCES Promotion(promotion_id) ON DELETE SET NULL
);

CREATE TABLE Showtime (
    showtime_id INT AUTO_INCREMENT PRIMARY KEY,
    movie_id INT NOT NULL,
    screen_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    base_price DECIMAL(10,2) NOT NULL,
    is_accessible BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (movie_id) REFERENCES Movie(movie_id) ON DELETE CASCADE,
    FOREIGN KEY (screen_id) REFERENCES Screen(screen_id) ON DELETE CASCADE
);

CREATE TABLE Ticket_type (
    ticket_type_id INT AUTO_INCREMENT PRIMARY KEY,
    type_name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    price_multiplier DECIMAL(3,2) DEFAULT 1.00,
    payment_status VARCHAR(50)
);

CREATE TABLE Ticket (
    ticket_id INT AUTO_INCREMENT PRIMARY KEY,
    showtime_id INT NOT NULL,
    users_id INT NOT NULL,
    seat_id INT NOT NULL,
    booking_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    ticket_status VARCHAR(50) DEFAULT 'ACTIVE',
    ticket_code VARCHAR(50),
    booking_id INT,
    ticket_type_id INT,
    FOREIGN KEY (showtime_id) REFERENCES Showtime(showtime_id) ON DELETE CASCADE,
    FOREIGN KEY (users_id) REFERENCES User(users_id) ON DELETE CASCADE,
    FOREIGN KEY (seat_id) REFERENCES Seat(seat_id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES Booking(booking_id) ON DELETE SET NULL,
    FOREIGN KEY (ticket_type_id) REFERENCES Ticket_type(ticket_type_id) ON DELETE SET NULL
);

CREATE TABLE Payment (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(50),
    ticket_type_id INT,
    payment_status VARCHAR(50) DEFAULT 'PENDING',
    FOREIGN KEY (ticket_id) REFERENCES Ticket(ticket_id) ON DELETE CASCADE,
    FOREIGN KEY (ticket_type_id) REFERENCES Ticket_type(ticket_type_id) ON DELETE SET NULL
);

CREATE TABLE tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    status ENUM('pending', 'completed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE booking_audit_log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT,
    users_id INT,
    action_type VARCHAR(50) NOT NULL,
    action_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    details TEXT
);

CREATE TABLE ticket_inventory (
    inventory_id INT AUTO_INCREMENT PRIMARY KEY,
    showtime_id INT NOT NULL,
    available_seats INT NOT NULL,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (showtime_id) REFERENCES Showtime(showtime_id) ON DELETE CASCADE
);

CREATE TABLE movie_rating (
    rating_id INT AUTO_INCREMENT PRIMARY KEY,
    movie_id INT NOT NULL,
    users_id INT NOT NULL,
    rating_value INT NOT NULL CHECK (rating_value BETWEEN 1 AND 5),
    review TEXT,
    rating_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (movie_id) REFERENCES Movie(movie_id) ON DELETE CASCADE,
    FOREIGN KEY (users_id) REFERENCES User(users_id) ON DELETE CASCADE,
    UNIQUE KEY (movie_id, users_id)
);

-- TRIGGER 1: Update ticket_inventory when a new ticket is created
DELIMITER //
CREATE TRIGGER after_ticket_insert
AFTER INSERT ON Ticket
FOR EACH ROW
BEGIN
    DECLARE available INT;
    
    SELECT COUNT(*) INTO @record_exists FROM ticket_inventory WHERE showtime_id = NEW.showtime_id;
    
    IF @record_exists > 0 THEN
        UPDATE ticket_inventory 
        SET available_seats = available_seats - 1,
            last_updated = NOW()
        WHERE showtime_id = NEW.showtime_id;
    ELSE
        SELECT s.total_seats INTO @total_seats
        FROM Showtime sh
        JOIN Screen s ON sh.screen_id = s.screen_id
        WHERE sh.showtime_id = NEW.showtime_id;
        
        INSERT INTO ticket_inventory (showtime_id, available_seats, last_updated)
        VALUES (NEW.showtime_id, @total_seats - 1, NOW());
    END IF;
END //
DELIMITER ;

DELIMITER //
CREATE TRIGGER after_ticket_delete
AFTER DELETE ON Ticket
FOR EACH ROW
BEGIN
    UPDATE ticket_inventory 
    SET available_seats = available_seats + 1,
        last_updated = NOW()
    WHERE showtime_id = OLD.showtime_id;
END //
DELIMITER ;

DELIMITER //
CREATE TRIGGER after_booking_insert
AFTER INSERT ON Booking
FOR EACH ROW
BEGIN
    INSERT INTO booking_audit_log (booking_id, users_id, action_type, details)
    VALUES (NEW.booking_id, NEW.users_id, 'CREATED', CONCAT('Booking created with status: ', NEW.booking_status));
END //
DELIMITER ;

DELIMITER //
CREATE TRIGGER after_booking_update
AFTER UPDATE ON Booking
FOR EACH ROW
BEGIN
    IF OLD.booking_status != NEW.booking_status THEN
        INSERT INTO booking_audit_log (booking_id, users_id, action_type, details)
        VALUES (NEW.booking_id, NEW.users_id, 'STATUS_CHANGED', 
                CONCAT('Status changed from ', OLD.booking_status, ' to ', NEW.booking_status));
    END IF;
END //
DELIMITER ;

DELIMITER //
CREATE TRIGGER after_payment_insert
AFTER INSERT ON Payment
FOR EACH ROW
BEGIN
    SELECT booking_id INTO @booking_id FROM Ticket WHERE ticket_id = NEW.ticket_id;
    
    IF @booking_id IS NOT NULL THEN
        UPDATE Booking 
        SET booking_status = 'CONFIRMED' 
        WHERE booking_id = @booking_id;
    END IF;
END //
DELIMITER ;

-- Sample Data Insertion

-- Sample Cinema
INSERT INTO Cinema (name, address, city, contact_number) 
VALUES ('CineWorld', '123 Main St', 'New York', '555-1234'),
       ('MoviePlex', '456 Oak Ave', 'Los Angeles', '555-5678'),
       ('FilmHouse', '789 Pine Rd', 'Chicago', '555-9012');

-- Sample Theater (for each cinema)
INSERT INTO Theater (cinema_id, theater_name, theater_type, capacity)
VALUES (1, 'Theater A', 'IMAX', 200),
       (1, 'Theater B', 'Standard', 150),
       (2, 'Theater 1', 'Dolby Atmos', 180),
       (3, 'Grand Hall', 'VIP', 120);

-- Sample Screen (for each theater)
INSERT INTO Screen (theater_id, screen_name, total_seats, screen_type)
VALUES (1, 'Screen 1', 200, 'IMAX'),
       (2, 'Screen 1', 150, 'Standard'),
       (3, 'Screen 1', 180, 'Dolby'),
       (4, 'Screen 1', 120, 'Luxury');

-- Sample Seats (just a few for each screen)
INSERT INTO Seat (screen_id, seat_number, seat_row, seat_type, price_multiplier, is_accessible)
VALUES (1, '1', 'A', 'Regular', 1.00, FALSE),
       (1, '2', 'A', 'Regular', 1.00, FALSE),
       (1, '1', 'B', 'Regular', 1.00, FALSE),
       (1, '2', 'B', 'Regular', 1.00, FALSE),
       (2, '1', 'A', 'Regular', 1.00, FALSE),
       (2, '2', 'A', 'Regular', 1.00, FALSE),
       (3, '1', 'A', 'Premium', 1.25, FALSE),
       (3, '2', 'A', 'Premium', 1.25, FALSE),
       (4, '1', 'A', 'VIP', 1.50, FALSE),
       (4, '2', 'A', 'VIP', 1.50, FALSE),
       (4, '3', 'A', 'Accessible', 1.00, TRUE);

-- Sample Movies
INSERT INTO Movie (title, description, duration, genre, rating, release_date)
VALUES ('Inception', 'A thief who steals corporate secrets through the use of dream-sharing technology', 148, 'Sci-Fi', 'PG-13', '2010-07-16'),
       ('The Shawshank Redemption', 'Two imprisoned men bond over a number of years', 142, 'Drama', 'R', '1994-09-23'),
       ('Avengers: Endgame', 'The Avengers take a final stand against Thanos', 181, 'Action', 'PG-13', '2019-04-26'),
       ('Parasite', 'Greed and class discrimination threaten the relationship between a wealthy family and a destitute clan', 132, 'Thriller', 'R', '2019-05-30');

-- Sample Users
INSERT INTO User (username, email, password, phone_number)
VALUES ('johndoe', 'john@example.com', 'password123', '555-1111'),
       ('janedoe', 'jane@example.com', 'password456', '555-2222'),
       ('bobsmith', 'bob@example.com', 'password789', '555-3333');

-- Sample Promotions
INSERT INTO Promotion (promo_code, discount_percentage, start_date, end_date)
VALUES ('SUMMER2025', 15.00, '2025-06-01 00:00:00', '2025-08-31 23:59:59'),
       ('WELCOME10', 10.00, '2025-01-01 00:00:00', '2025-12-31 23:59:59');

-- Sample Showtimes
INSERT INTO Showtime (movie_id, screen_id, start_time, end_time, base_price, is_accessible)
VALUES (1, 1, '2025-05-15 18:00:00', '2025-05-15 20:30:00', 12.99, TRUE),
       (2, 2, '2025-05-15 19:00:00', '2025-05-15 21:30:00', 10.99, FALSE),
       (3, 3, '2025-05-15 20:00:00', '2025-05-15 23:00:00', 14.99, TRUE),
       (4, 4, '2025-05-15 21:00:00', '2025-05-15 23:15:00', 16.99, TRUE);

-- Sample Ticket Types
INSERT INTO Ticket_type (type_name, description, price_multiplier, payment_status)
VALUES ('Adult', 'Standard adult ticket', 1.00, 'ACTIVE'),
       ('Child', 'For children under 12', 0.75, 'ACTIVE'),
       ('Senior', 'For adults over 65', 0.80, 'ACTIVE'),
       ('Student', 'With valid student ID', 0.90, 'ACTIVE');

-- Sample Bookings
INSERT INTO Booking (users_id, booking_status, promotion_id)
VALUES (1, 'PENDING', 1),
       (2, 'PENDING', 2),
       (3, 'PENDING', NULL);

-- Demonstrate trigger functionality (observe booking_audit_log)
SELECT * FROM booking_audit_log;

-- Sample Tickets (will trigger ticket_inventory updates)
INSERT INTO Ticket (showtime_id, users_id, seat_id, ticket_status, ticket_code, booking_id, ticket_type_id)
VALUES (1, 1, 1, 'ACTIVE', 'TKT123456', 1, 1),
       (1, 1, 2, 'ACTIVE', 'TKT123457', 1, 2),
       (2, 2, 5, 'ACTIVE', 'TKT789012', 2, 1),
       (3, 3, 7, 'ACTIVE', 'TKT345678', 3, 3);

-- Demonstrate ticket inventory trigger
SELECT * FROM ticket_inventory;

-- Sample Payments (will trigger booking status update)
INSERT INTO Payment (ticket_id, amount, payment_method, ticket_type_id)
VALUES (1, 12.99, 'CREDIT_CARD', 1),
       (2, 9.74, 'CREDIT_CARD', 2),
       (3, 10.99, 'PAYPAL', 1),
       (4, 11.99, 'CREDIT_CARD', 3);

-- Demonstrate booking status trigger
SELECT b.booking_id, b.booking_status, al.action_type, al.details 
FROM Booking b
JOIN booking_audit_log al ON b.booking_id = al.booking_id
ORDER BY al.log_id;

-- Test ticket cancellation (will update inventory)
DELETE FROM Ticket WHERE ticket_id = 1;

-- Show updated inventory after cancellation
SELECT * FROM ticket_inventory;

-- Add a movie rating
INSERT INTO movie_rating (movie_id, users_id, rating_value, review)
VALUES (1, 1, 5, 'Excellent movie! Mind-bending plot.'),
       (1, 2, 4, 'Great special effects but confusing at times.'),
       (2, 3, 5, 'Classic film. One of the best ever made.');

-- Show average movie ratings
SELECT m.title, 
       AVG(mr.rating_value) AS average_rating,
       COUNT(mr.rating_id) AS total_ratings
FROM Movie m
LEFT JOIN movie_rating mr ON m.movie_id = mr.movie_id
GROUP BY m.movie_id
ORDER BY average_rating DESC;

UPDATE Booking SET booking_status = 'CONFIRMED' WHERE booking_id = 3;

SELECT * FROM booking_audit_log WHERE booking_id = 3;

INSERT INTO tasks (description) VALUES ('Add new summer movie releases');

UPDATE tasks SET status = 'completed' WHERE id = 1;

SELECT * FROM tasks;