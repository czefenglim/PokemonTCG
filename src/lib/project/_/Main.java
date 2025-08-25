/**
 * Main.java (Bridge Solution Demo)
 * --------------------------------
 * Demonstrates how the Bridge pattern decouples MusicPlayer from OS-specific
 * playback logic, making the system portable across platforms.
 *
 * Issues solved:
 *  - No more hardcoded "cmd /c start" or "xdg-open".
 *  - MusicPlayer now delegates playback to PlayerImplementation (Windows/Linux).
 *
 * Issues still remaining (for Factory Pattern later):
 *  - Unsupported formats (.aac/.flac) are still rejected.
 *  - No extensible way to add new formats (hardcoded check).
 */
public class Main {
    public static void main(String[] args) {
        System.out.println("[Detected OS: " + System.getProperty("os.name") + "]\n");

        System.out.println("=======================================");
        System.out.println("===   Music Player Demo (Bridge)    ===");
        System.out.println("=======================================\n");

        // Create songs
        Song mp3 = new Song("Song One (MP3)", "song1.mp3");
        Song wav = new Song("Song Two (WAV)", "song2.wav");

        Playlist playlist = new Playlist("Bridge Playlist");
        playlist.addSong(mp3);
        playlist.addSong(wav);

        User user = new User("Alice", "alice@example.com");
        user.addPlaylist(playlist);

        // ---------------- Normal Playback (Windows impl) ----------------
        PlayerImplementation windowsImpl = new WindowsPlayer();
        MusicPlayer player = new MusicPlayer(playlist, windowsImpl);

        System.out.println(">>> Normal Operations (portable across OS) <<<\n");
        player.play();
        player.pause();
        player.playSong(wav);
        player.play();

        // ---------------- Switch Implementation at Runtime ----------------
        System.out.println("\n>>> Switching Implementation to Linux <<<");
        PlayerImplementation linuxImpl = new LinuxPlayer();
        MusicPlayer linuxPlayer = new MusicPlayer(playlist, linuxImpl);

        linuxPlayer.play();
        linuxPlayer.pause();

        // ---------------- Remaining Problem Case (Factory needed) ----------------
        System.out.println("\n=======================================");
        System.out.println("===   Remaining Issue: Unsupported   ===");
        System.out.println("=======================================\n");

        System.out.println(">>> Case: Unsupported format (.aac /.flac) <<<");
        Song aac  = new Song("AAC Track",  "song4.aac");
        Song flac = new Song("FLAC Track", "song5.flac");
        playlist.addSong(aac);
        playlist.addSong(flac);
        player.playSong(aac);   // still prints unsupported format
        player.playSong(flac);  // still prints unsupported format

        // ---------------- Summary ----------------
        System.out.println("\n=======================================");
        System.out.println("===        User Playlists           ===");
        System.out.println("=======================================\n");
        System.out.println("User " + user.getName() + " owns playlists:");
        for (Playlist pl : user.getPlaylists()) {
            System.out.println(" - " + pl.getName());
            for (Song s : pl.getSongs()) {
                System.out.println("    * " + s.getTitle() + " (" + s.getFilePath() + ")");
            }
        }

        System.out.println("\n=== End of Bridge Demo ===");
    }
}
