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
        echo "Connected successfully";
    ?>

</body>
</html>
