package pksmatches.util;

import java.io.IOException;
import java.io.InputStream;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Properties;

public class DatabaseManager {
    private static final Properties props = new Properties();

    static {
        try (InputStream in = DatabaseManager.class.getClassLoader().getResourceAsStream("db.properties")) {
            if (in == null) throw new RuntimeException("db.properties not found");
            props.load(in);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(
                props.getProperty("db.url"),
                props.getProperty("db.user"),
                props.getProperty("db.password")
        );
    }
}