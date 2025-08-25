import java.util.ArrayList;
import java.util.List;

public class Playlist {
    // Attributes
    private String name;
    private List<Song> songs;

    // Constructor
    public Playlist(String name) {
        this.name = name;
        this.songs = new ArrayList<>();
    }

    // Methods
    public void addSong(Song song) {
        songs.add(song);
    }

    public void removeSong(Song song) {
        songs.remove(song);
    }

    public void shuffle() {
        // Simplified: shuffle implementation can be added
    }

    public List<Song> getSongs() {
        return songs;
    }

    public String getName() {
        return name;
    }
}
