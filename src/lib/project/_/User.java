import java.util.ArrayList;
import java.util.List;

public class User {
    // Attributes
    private String name;
    private String email;
    private List<Playlist> playlists;

    // Constructor
    public User(String name, String email) {
        this.name = name;
        this.email = email;
        this.playlists = new ArrayList<>();
    }

    // Methods
    public void addPlaylist(Playlist playlist) {
        playlists.add(playlist);
    }

    public List<Playlist> getPlaylists() {
        return playlists;
    }

    public String getName() {
        return name;
    }
}
