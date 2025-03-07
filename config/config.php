<?php
define("DB_HOST", "localhost");
define("DB_USER", "root"); // Cambia se hai un altro utente
define("DB_PASS", ""); // Cambia se hai una password
define("DB_NAME", "silvi");

// Funzione per connettersi al database
function connectDB() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if ($conn->connect_error) {
        die("Connessione al database fallita: " . $conn->connect_error);
    }
    return $conn;
}
?>
