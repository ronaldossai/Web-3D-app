document.addEventListener("DOMContentLoaded", function () {
    const audio = document.getElementById("bg-music");
    const playButton = document.getElementById("play-button");
    const muteButton = document.getElementById("mute-button");
    
    let isPlaying = false;

    // Play button functionality
    playButton.addEventListener("click", function () {
        if (isPlaying) {
            // Pause music
            audio.pause();
            playButton.innerHTML = '<i class="fas fa-play"></i>';
            isPlaying = false;
        } else {
            // Play music
            audio.play();
            playButton.innerHTML = '<i class="fas fa-pause"></i>';
            isPlaying = true;
        }
    });

    // Toggle mute/unmute on button click
    muteButton.addEventListener("click", function () {
        if (audio.muted) {
            audio.muted = false;
            muteButton.innerHTML = '<i class="fas fa-volume-up"></i>';
        } else {
            audio.muted = true;
            muteButton.innerHTML = '<i class="fas fa-volume-mute"></i>';
        }
    });
});