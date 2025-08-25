public class MusicPlayer {
    private Song currentSong;
    private Playlist playlist;
    private int currentIndex;
    private boolean isPlaying;
    private boolean isRepeat;

    private PlayerImplementation playerImpl;

    public MusicPlayer(Playlist playlist, PlayerImplementation playerImpl) {
        this.playlist = playlist;
        this.playerImpl = playerImpl;
        this.currentIndex = 0;
        this.isPlaying = false;
        this.isRepeat = false;
    }

    public void play() {
        if (playlist.getSongs().isEmpty()) return;
        currentSong = playlist.getSongs().get(currentIndex);
        playerImpl.playAudio(currentSong.getFilePath());
        isPlaying = true;
    }

    public void playSong(Song song) {
        this.currentSong = song;
        playerImpl.playAudio(song.getFilePath());
        isPlaying = true;
    }

    public void pause() {
        if (isPlaying) {
            playerImpl.pauseAudio();
            isPlaying = false;
        }
    }

    public void next() {
        if (playlist.getSongs().isEmpty()) return;
        currentIndex = (currentIndex + 1) % playlist.getSongs().size();
        play();
    }

    public void previous() {
        if (playlist.getSongs().isEmpty()) return;
        currentIndex = (currentIndex - 1 + playlist.getSongs().size()) % playlist.getSongs().size();
        play();
    }

    public void repeat() {
        isRepeat = !isRepeat;
    }

    public Song getCurrentSong() {
        return currentSong;
    }
}
