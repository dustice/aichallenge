<?php
include 'header.php';
include_once 'rankings_widget.php';

echo <<<EOT
<h2>Current Rankings</h2>
<p>These rankings are updated continuously, 24 hours a day. Want to see your
  name on the leaderboard? Check out the <a href="quickstart.php">
  Five Minute Quickstart Guide</a>!</p>
EOT;

echo getRankingsTableString(1, false, 100, "");

include 'footer.php';
?>
