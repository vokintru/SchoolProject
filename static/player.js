document.addEventListener("DOMContentLoaded", function () {
    const trackList = document.querySelectorAll('.track-list li');
    const audio = document.getElementById('audio');
    const playPauseBtn = document.getElementById('playPause');
    const progressBar = document.getElementById('progressBar');
    const progressContainer = document.getElementById('progressContainer');
    const uploadBtn = document.getElementById('uploadBtn');
    const uploadModal = document.getElementById('uploadModal');
    const closeModal = document.getElementById('closeModal');
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeBar = document.getElementById('volumeBar');
    let currentTrackIndex = -1;

    function loadTrack(index) {
        const track = trackList[index];
        audio.src = track.getAttribute('data-src');
    }

    function updateTrackIndicator() {
        trackList.forEach((track, index) => {
            if (index === currentTrackIndex) {
                track.classList.add("playing");
                track.querySelector(".track-icon").innerHTML = '<i class="fa fa-pause"></i>';
            } else {
                track.classList.remove("playing");
                track.querySelector(".track-icon").innerHTML = '<i class="fa fa-play"></i>';
            }
        });
    }

    playPauseBtn.addEventListener('click', () => {
        if (audio.paused) {
            audio.play();
            playPauseBtn.innerHTML = '<i class="fa fa-pause"></i>';
        } else {
            audio.pause();
            playPauseBtn.innerHTML = '<i class="fa fa-play"></i>';
        }
        updateTrackIndicator();
    });

    trackList.forEach((track, index) => {
        track.addEventListener('click', (event) => {
            if (event.target.closest('.edit-button')) {
                return;
            }

            if (currentTrackIndex === index) {
                if (audio.paused) {
                    audio.play();
                    playPauseBtn.innerHTML = '<i class="fa fa-pause"></i>';
                } else {
                    audio.pause();
                    playPauseBtn.innerHTML = '<i class="fa fa-play"></i>';
                }
            } else {
                currentTrackIndex = index;
                loadTrack(index);
                audio.play();
                playPauseBtn.innerHTML = '<i class="fa fa-pause"></i>';
            }
            updateTrackIndicator();
        });
    });

    document.querySelectorAll(".edit-button").forEach(button => {
        button.addEventListener("click", function (event) {
            event.stopPropagation();
            let trackId = this.dataset.trackId;
            console.log("Редактирование трека с ID:", trackId);
        });
    });

    audio.addEventListener('timeupdate', () => {
        const progressPercent = (audio.currentTime / audio.duration) * 100;
        progressBar.style.width = `${progressPercent}%`;
    });

    audio.addEventListener("pause", updateTrackIndicator);
    audio.addEventListener("play", updateTrackIndicator);

    progressContainer.addEventListener('click', (e) => {
        const width = progressContainer.clientWidth;
        const clickX = e.offsetX;
        const duration = audio.duration;
        audio.currentTime = (clickX / width) * duration;
    });

    const savedVolume = localStorage.getItem('volume') ? localStorage.getItem('volume') : 0.5;
    audio.volume = savedVolume;
    volumeBar.style.width = `${savedVolume * 100}%`;

    volumeSlider.addEventListener('click', (e) => {
        const width = volumeSlider.clientWidth;
        const clickX = e.offsetX;
        audio.volume = clickX / width;
        volumeBar.style.width = `${audio.volume * 100}%`;
        localStorage.setItem('volume', audio.volume);
    });

    volumeSlider.addEventListener('wheel', (e) => {
        e.preventDefault();
        let newVolume = audio.volume + (e.deltaY < 0 ? 0.05 : -0.05);
        if (newVolume < 0) newVolume = 0;
        if (newVolume > 1) newVolume = 1;
        audio.volume = newVolume;
        volumeBar.style.width = `${audio.volume * 100}%`;
        localStorage.setItem('volume', audio.volume);
    });

    uploadBtn.addEventListener('click', () => {
        uploadModal.style.display = 'block';
    });

    closeModal.addEventListener('click', () => {
        uploadModal.style.display = 'none';
    });

    window.onclick = (event) => {
        if (event.target == uploadModal) {
            uploadModal.style.display = 'none';
        }
    };

    loadTrack(currentTrackIndex);

    // Добавляем обработку событий клавиш
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') { // При нажатии пробела
            e.preventDefault(); // Предотвратить стандартное действие
            if (audio.paused) {
                audio.play();
                playPauseBtn.innerHTML = '<i class="fa fa-pause"></i>';
            } else {
                audio.pause();
                playPauseBtn.innerHTML = '<i class="fa fa-play"></i>';
            }
            updateTrackIndicator();
        }
    });
});
