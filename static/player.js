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
        audio.load();
        audio.play();
    }

    function updateTrackIndicator() {
        trackList.forEach((track, index) => {
            if (index === currentTrackIndex) {
                track.classList.add("playing");
            } else {
                track.classList.remove("playing");
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
            if (event.target.closest('.delete-button')) {
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

            let modal = document.getElementById("editTrackModal");
            modal.querySelector("#trackId").value = trackId;
            modal.style.display = "flex";

            let form = modal.querySelector("form");
            form.action = "/edit_track/" + trackId;
        });
    });

    document.getElementById("closeEditModal").addEventListener("click", function () {
        document.getElementById("editTrackModal").style.display = "none";
    });

    window.addEventListener("click", function (event) {
        let modal = document.getElementById("editTrackModal");
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });

    document.querySelectorAll(".delete-button").forEach(button => {
        button.addEventListener("click", function (event) {
            event.stopPropagation();
            let trackId = this.dataset.trackId;
            console.log("Удаление трека с ID:", trackId);

            let modal = document.getElementById("deleteTrackModal");
            modal.querySelector("#deleteTrackModal > div > div > a").href = "/api/delete/" + trackId;

            modal.style.display = "flex";
        });
    });

    document.getElementById("closeDeleteModal").addEventListener("click", function () {
        document.getElementById("deleteTrackModal").style.display = "none";
    });

    document.getElementById("closeDeleteModalBtn").addEventListener("click", function () {
        document.getElementById("deleteTrackModal").style.display = "none";
    });

    window.addEventListener("click", function (event) {
        let modal = document.getElementById("deleteTrackModal");
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });

    document.getElementById("next").addEventListener("click", () => {
        if (currentTrackIndex < trackList.length - 1) {
            currentTrackIndex++;
            loadTrack(currentTrackIndex);
        }
    });

    document.getElementById("prev").addEventListener("click", () => {
        if (currentTrackIndex > 0) {
            currentTrackIndex--;
            loadTrack(currentTrackIndex);
        }
    });

    audio.addEventListener('ended', () => {
        if (currentTrackIndex < trackList.length - 1) {
            currentTrackIndex++;
            loadTrack(currentTrackIndex);
        }
    });

    audio.addEventListener('timeupdate', () => {
        const progressPercent = (audio.currentTime / audio.duration) * 100;
        progressBar.style.width = `${progressPercent}%`;
    });

    function updateProgress(e) {
        const width = progressContainer.clientWidth;
        const offsetX = e.offsetX || e.changedTouches[0].clientX - progressContainer.getBoundingClientRect().left;
        const newTime = (offsetX / width) * audio.duration;
        audio.currentTime = newTime;
        progressBar.style.width = `${(newTime / audio.duration) * 100}%`;
    }

    progressContainer.addEventListener('mousedown', (e) => {
        isDragging = true;
        audio.pause();
        updateProgress(e);
    });

    progressContainer.addEventListener('mousemove', (e) => {
        if (isDragging) {
            updateProgress(e);
        }
    });

    progressContainer.addEventListener('mouseup', () => {
        isDragging = false;
        audio.play();
    });

    progressContainer.addEventListener('touchstart', (e) => {
        isDragging = true;
        audio.pause();
        updateProgress(e);
    });

    progressContainer.addEventListener('touchmove', (e) => {
        if (isDragging) {
            updateProgress(e);
        }
    });

    progressContainer.addEventListener('touchend', () => {
        isDragging = false;
        audio.play();
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

    let isDragging = false;

    function updateVolume(e) {
        const width = volumeSlider.clientWidth;
        const offsetX = e.offsetX || e.changedTouches[0].clientX - volumeSlider.getBoundingClientRect().left;
        const volume = Math.min(Math.max(offsetX / width, 0), 1);
        audio.volume = volume;
        volumeBar.style.width = `${volume * 100}%`;
        localStorage.setItem('volume', audio.volume);
    }

    volumeSlider.addEventListener('mousedown', (e) => {
        isDragging = true;
        updateVolume(e);
    });

    volumeSlider.addEventListener('mousemove', (e) => {
        if (isDragging) {
            updateVolume(e);
        }
    });

    volumeSlider.addEventListener('mouseup', () => {
        isDragging = false;
    });

    volumeSlider.addEventListener('touchstart', (e) => {
        isDragging = true;
        updateVolume(e);
    });

    volumeSlider.addEventListener('touchmove', (e) => {
        if (isDragging) {
            updateVolume(e);
        }
    });

    volumeSlider.addEventListener('touchend', () => {
        isDragging = false;
    });

    volumeSlider.addEventListener('click', updateVolume);


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

    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
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

function showNotification(statusCode) {
const notification = document.getElementById('notification');
const message = document.getElementById('notificationMessage');
const closeBtn = document.getElementById('closeBtn');

if (!statusCode) return;

switch (statusCode) {
    case 200:
        notification.classList.add('success');
        message.textContent = 'Успешно!';
        break;
    case 404:
        notification.classList.add('error');
        message.textContent = 'Трек не найден!';
        break;
    case 403:
        notification.classList.add('error');
        message.textContent = 'Нет доступа!';
        break;
    default:
        return;
}

notification.classList.add('show');

setTimeout(() => {
    notification.classList.add('exit');
    setTimeout(() => {
        notification.classList.remove('show', 'exit');
        notification.classList.remove('success', 'error');
    }, 500);
}, 3000);

closeBtn.addEventListener('click', () => {
    notification.classList.add('exit');
    setTimeout(() => {
        notification.classList.remove('show', 'exit');
        notification.classList.remove('success', 'error');
    }, 500);
});
}