<html>

<head>
    <style>
    .btn {
        display: inline-block;
        padding: 10px 20px;
        background-color: #007BFF;
        color: #fff;
        text-decoration: none;
        border: none;
        border-radius: 5px;
        font-size: 16px;
        transition: background-color 0.3s ease;
        margin-left: 0x;
    }

    .btn:hover {
        background-color: #0056b3;
    }

    .container {
        width: 450px;
        content: "";
        display: table;
        position: absolute;
        left: 10px;
        top: 10px;
    }

    .row {
        clear: both;
    }

    .seat {
        width: 30px;
        height: 30px;
        border: 1px solid black;
        float: left;
        box-sizing: border-box;
        cursor: pointer;
        display: flex;
        justify-content: center;
        align-items: center;
        font-weight: bold;
        font-size: 14px;
    }

    .seat.selected {
        background-color: skyblue;
        color: white;
    }

    .div2 {
        width: 30px;
        height: 30px;
        border: 1px solid red;
        clear: both;
    }

    .clear {
        clear: both;
    }

    .container1 {
        width: 450px;
        position: absolute;
        left: 450px;
        top: 10px;
    }

    .container1-inner {
        display: table;
    }


    .container-parent {
        display: flex;
        justify-content: space-between;
    }

    .container2 {
        width: 450px;
        position: absolute;
        left: 930px;
        top: 10px;
    }

    .container2-inner {
        display: table;
    }

    .seatred {
        width: 30px;
        height: 30px;
        background-color: red;
    }

    .seatsilver {
        width: 30px;
        height: 30px;
        background-color: silver;
    }

    .space {
        width: 50px;
        display: inline-block;
    }
    </style>
</head>

<body>
    </br>
    <center>Stage</center></br></br>
    <hr>
    </hr <div>
    <div class="space">
        <div class="space">
            <div class="seatred"></div>
        </div>
    </div>Sold</br></br>

    <div class="space">
        <div class="space">
            <div class="seatsilver"></div>
        </div>
    </div>Available
    </div></br></br></br>
    Total seats

    <div class="container-parent">
        <div class="container">
            </br></br></br></br></br></br></br></br></br></br></br></br></br></br></br></br>
            <?php
    $rowCount = 9;
    $seatNumber = 1;
    $columns = [10, 10, 10, 10, 10, 9, 10, 9,9];
   
    for ($i = 0; $i < $rowCount; $i++) {
      echo '<div class="row">';
      $colCount = $columns[$i];
      for ($j = 0; $j < $colCount; $j++) {
        echo '<div class="seat">' . $seatNumber . '</div>';
        $seatNumber++;
      }
      echo '</div>';
    }
    ?>

            </br></br></br></br></br></br>

        </div>

        <div class="container1">
            <div class="container1-inner">
                </br></br></br></br></br></br></br></br></br></br></br></br></br></br></br></br>
                <?php
      $rowCount = 11;
      $seatNumber = 1;
      $columns = [10, 10, 10, 10, 10, 9, 10, 9, 9,9,9];
     
      for ($i = 0; $i < $rowCount; $i++) {
        echo '<div class="row">';
        $colCount = $columns[$i];
        for ($j = 0; $j < $colCount; $j++) {
          echo '<div class="seat">' . $seatNumber . '</div>';
          $seatNumber++;
        }
        echo '</div>';
      }
    ?>
                </br></br></br></br>

            </div>
        </div>


        <div class="container2">
            <div class="container2-inner">
                </br></br></br></br></br></br></br></br></br></br></br></br></br></br></br></br>


            </div>
        </div>
    </div>
    <!-- Add this button within your existing HTML body -->


    <script>
    document.addEventListener("DOMContentLoaded", function() {
        var seats = document.querySelectorAll(".seat");

        seats.forEach(function(seat) {
            seat.addEventListener("click", function() {
                seat.classList.toggle("selected");
            });
        });

        // Add event listener to the "Open New Page" button
        var openNewPageButton = document.getElementById("openNewPageButton");
        openNewPageButton.addEventListener("click", function() {
            // Open a new window or tab with the provided URL
            var newPageURL = "new_page.php"; // Replace with the actual URL
            window.open(newPageURL, "_blank");
        });
    });
    </script>
    <center>

</body>

</html>