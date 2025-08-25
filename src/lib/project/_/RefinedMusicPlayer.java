public class RefinedMusicPlayer extends MusicPlayer {

    public RefinedMusicPlayer(Playlist playlist, PlayerImplementation impl) {
        super(playlist, impl);
    }

    public void shuffle() {
        getPlaylist().shuffle();
        System.out.println("Playlist shuffled.");
    }

    public void seek(int seconds) {
        System.out.println("Seeking to " + seconds + " seconds.");
        // Implementation would depend on actual playback library
    }

    public void setPlaybackSpeed(double speed) {
        System.out.println("Setting playback speed to " + speed + "x.");
    }

    // Provide access to playlist for shuffle
    private Playlist getPlaylist() {
        try {
            java.lang.reflect.Field field = MusicPlayer.class.getDeclaredField("playlist");
            field.setAccessible(true);
            return (Playlist) field.get(this);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
