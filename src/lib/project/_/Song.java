public class Song {
    // Attributes
    private String title;
    private String filePath;

    // Constructor
    public Song(String title, String filePath) {
        this.title = title;
        this.filePath = filePath;
    }

    // Methods
    public String getTitle() {
        return title;
    }

    public String getFilePath() {
        return filePath;
    }

    @Override
    public String toString() {
        return title + " (" + filePath + ")";
    }
}
