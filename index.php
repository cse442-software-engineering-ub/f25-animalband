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

        // Create connection
        $conn = new mysqli($servername, $username, $password);

        // Check connection
        if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
        }
        echo "Successfully connected MySQL database";

        $sql="CREATE TABLE Animals (
            Name VARCHAR(50),
            Instrument VARCHAR(50)
        )";

        if ($conn->query($sql) === TRUE) {
            echo "Table MyGuests created successfully";
        } else {
            echo "Error creating table: " . $conn->error;
        }

        $sql="INSERT INTO Animals (Name, Instrument) VALUES
            (Monkey, Drums),
            (Flamingo, Triangle),
            (Lizard, Xylophone)";

        $conn->query($sql);

        $sql="SELECT * FROM Animals";
        $result=$conn->query($sql);
        while ($row=$result->fetch_assoc()) {
            echo "Animal: " . $row["Name"] . " Instrument: " . $row["Instrument"] . "\n";
        }
        $conn->close();
    ?>

</body>
</html>
