<!DOCTYPE html>
<html>
<head>
    <title style="text-align: center;">WELCOME TO ANIMALBAND!</title>
</head>
<body>

    <h2 style="text-align: center;">There is no content here.</h2>

    <p style="text-align: center;">[Imagine a stage.]</p>

    <?php

    echo "<p style=\"text-align: center;\">Hello World!</p>";

    $servername = "localhost";
    $username = "ikimos";
    $password = "50445468";

    $conn = new mysqli($servername, $username, $password, "cse442_2025_fall_team_h_db");

    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }
    echo "Successfully connected MySQL database<br>";

    $conn->query("DROP TABLE IF EXISTS Animals");

    $sql = "CREATE TABLE Animals (
        Name VARCHAR(50),
        Instrument VARCHAR(50)
    )";
    if ($conn->query($sql) === TRUE) {
        echo "Table Animals created successfully<br>";
    } else {
        echo "Error creating table: " . $conn->error . "<br>";
    }

    $sql = "INSERT INTO Animals (Name, Instrument) VALUES
        ('Monkey', 'Drums'),
        ('Flamingo', 'Triangle'),
        ('Lizard', 'Xylophone')";
    if ($conn->query($sql) === TRUE) {
        echo "New records created successfully<br>";
    } else {
        echo "Error inserting records: " . $conn->error . "<br>";
    }

    $sql = "SELECT * FROM Animals";
    $result = $conn->query($sql);
    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            echo "Animal: " . $row["Name"] . " Instrument: " . $row["Instrument"] . "<br>";
        }
    } else {
        echo "No records found<br>";
    }

    $conn->close();

?>


</body>
</html>
