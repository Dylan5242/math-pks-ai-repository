package pksmatches.ui;

import pksmatches.model.Match;
import pksmatches.model.Tournament;
import pksmatches.model.User;
import pksmatches.model.enums.MatchStatus;
import pksmatches.model.enums.TournamentStage;
import pksmatches.model.enums.UserRole;
import pksmatches.src.main.java.pksmatches.repository.MatchRepository;
import pksmatches.repository.TournamentRepository;
import pksmatches.repository.UserRepository;
import pksmatches.repository.impl.MatchRepositoryJdbc;
import pksmatches.repository.impl.TournamentRepositoryJdbc;
import pksmatches.repository.impl.UserRepositoryJdbc;
import pksmatches.service.MatchService;
import pksmatches.service.TournamentService;
import pksmatches.service.UserService;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Scanner;

public class ConsoleApp {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd.MM.yyyy");
    private static final DateTimeFormatter DATETIME_FMT = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");

    private final Scanner scanner = new Scanner(System.in, java.nio.charset.StandardCharsets.UTF_8);
    private final MatchService matchService;
    private final TournamentService tournamentService;
    private final UserService userService;

    private User currentUser;

    public ConsoleApp() {
        MatchRepository matchRepository = new MatchRepositoryJdbc();
        TournamentRepository tournamentRepository = new TournamentRepositoryJdbc();
        UserRepository userRepository = new UserRepositoryJdbc();

        this.matchService = new MatchService(matchRepository);
        this.tournamentService = new TournamentService(tournamentRepository);
        this.userService = new UserService(userRepository);
    }

    public void run() {
        System.out.println("=== Агрегатор матчей ===");

        if (!login()) {
            System.out.println("Выход.");
            return;
        }

        boolean running = true;
        while (running) {
            printMenu();
            int choice = readInt("Выбор: ");
            switch (choice) {
                case 1 -> listMatches();
                case 2 -> listLiveMatches();
                case 3 -> listMatchesByTournament();
                case 4 -> addMatch();
                case 5 -> startMatch();
                case 6 -> finishMatch();
                case 7 -> updateScore();
                case 8 -> cancelMatch();
                case 9 -> listTournaments();
                case 10 -> addTournament();
                case 11 -> listUsers();
                case 12 -> addUser();
                case 13 -> logout();
                case 0 -> running = false;
                default -> System.out.println("Неверный пункт меню.");
            }
        }
        System.out.println("До свидания.");
    }

        private void logout() {
        System.out.println("Выход из профиля " + currentUser.getUsername() + ".");
        currentUser = null;
        while (currentUser == null) {
            System.out.println();
            System.out.println("=== Вход в систему ===");
            if (!login()) {
                System.out.println("Попробуйте снова.");
            }
        }
    }

    private void printMenu() {
        System.out.println();
        System.out.println("Пользователь: " + currentUser.getUsername()
                + " (" + currentUser.getRole() + ")");
        System.out.println("1. Все матчи");
        System.out.println("2. Live-матчи");
        System.out.println("3. Матчи турнира");
        System.out.println("4. Добавить матч");
        System.out.println("5. Начать матч");
        System.out.println("6. Завершить матч");
        System.out.println("7. Обновить счёт");
        System.out.println("8. Отменить матч");
        System.out.println("9. Список турниров");
        System.out.println("10. Добавить турнир");
        System.out.println("11. Список пользователей");
        System.out.println("12. Добавить пользователя");
        System.out.println("13. Сменить пользователя (Logout)");
        System.out.println("0. Выход");
    }

    private boolean login() {
        System.out.print("Логин: ");
        String login = scanner.nextLine().trim();
        System.out.print("Пароль: ");
        String password = scanner.nextLine().trim();

        User user = userService.authenticate(login, password);
        if (user == null) {
            System.out.println("Неверный логин или пароль.");
            return false;
        }
        currentUser = user;
        System.out.println("Добро пожаловать, " + user.getUsername() + "!");
        return true;
    }

    private void listMatches() {
        printMatches(matchService.getAllMatches());
    }

    private void listLiveMatches() {
        printMatches(matchService.getLiveMatches());
    }

    private void listMatchesByTournament() {
        Tournament t = selectTournament();
        if (t == null) return;
        printMatches(matchService.getMatchesByTournament(t));
    }

    private void addMatch() {
        if (!requireAdmin()) return;
        Tournament t = selectTournament();
        if (t == null) return;

        String team1 = readNonEmpty("Команда 1: ");
        String team2 = readNonEmpty("Команда 2: ");
        LocalDateTime date = readDateTime("Дата и время (dd.MM.yyyy HH:mm): ");
        TournamentStage stage = readStage();

        try {
            Match m = new Match(t, team1, team2, date, stage);
            matchService.addMatch(m);
            System.out.println("Матч добавлен. ID=" + m.getId());
        } catch (IllegalArgumentException | IllegalStateException e) {
            System.out.println("Ошибка: " + e.getMessage());
        }
    }

    private void startMatch() {
        Match m = selectMatch();
        if (m == null) return;
        try {
            matchService.startLive(m.getId());
            System.out.println("Матч переведён в статус LIVE.");
        } catch (IllegalStateException e) {
            System.out.println("Ошибка: " + e.getMessage());
        }
    }

    private void finishMatch() {
        Match m = selectMatch();
        if (m == null) return;
        try {
            matchService.finish(m.getId());
            System.out.println("Матч завершён.");
        } catch (IllegalStateException e) {
            System.out.println("Ошибка: " + e.getMessage());
        }
    }

    private void updateScore() {
        Match m = selectMatch();
        if (m == null) return;
        int s1 = readInt("Счёт команды 1: ");
        int s2 = readInt("Счёт команды 2: ");
        try {
            matchService.updateScore(m.getId(), s1, s2);
            System.out.println("Счёт обновлён.");
        } catch (IllegalArgumentException | IllegalStateException e) {
            System.out.println("Ошибка: " + e.getMessage());
        }
    }

    private void cancelMatch() {
        Match m = selectMatch();
        if (m == null) return;
        try {
            matchService.cancel(m.getId());
            System.out.println("Матч отменён.");
        } catch (IllegalStateException e) {
            System.out.println("Ошибка: " + e.getMessage());
        }
    }

    private void listTournaments() {
        List<Tournament> list = tournamentService.getAll();
        if (list.isEmpty()) {
            System.out.println("Турниров нет.");
            return;
        }
        for (Tournament t : list) {
            String name = t.getName();
            LocalDate startDate = t.getStartDate();
            LocalDate endDate = t.getEndDate();

            String formattedStartDate = startDate.format(DATE_FMT);
            String formattedEndDate = endDate.format(DATE_FMT);

            System.out.println("Турнир " + name + " начинается " + formattedStartDate + ", заканчивается " + formattedEndDate);
        }
    }

    private void addTournament() {
        if (!requireAdmin()) return;
        String name = readNonEmpty("Название турнира: ");
//        String name = "Нижний Новгород";
        LocalDate start = readDate("Дата начала (dd.MM.yyyy): ");
        LocalDate end = readDate("Дата окончания (dd.MM.yyyy): ");
        try {
            Tournament t = new Tournament(name, start, end);
            tournamentService.add(t);
            System.out.println("Турнир добавлен. ID=" + t.getId());
        } catch (IllegalArgumentException e) {
            System.out.println("Ошибка: " + e.getMessage());
        }
    }

    private void listUsers() {
        if (!requireAdmin()) return;
        for (User u : userService.getAll()) {
            int id = u.getId();
            String username = u.getUsername();
            UserRole role = u.getRole();

            System.out.println(id + ". Пользователь " + username + " имеет роль " + role);
        }
    }

    private void addUser() {
        if (!requireAdmin()) return;
        String username = readNonEmpty("Логин: ");
        String password = readNonEmpty("Пароль: ");
        System.out.print("Роль (ADMIN/USER/GUEST, по умолчанию USER): ");
        String roleStr = scanner.nextLine().trim().toUpperCase();
        UserRole role;
        try {
            role = roleStr.isEmpty() ? UserRole.USER : UserRole.valueOf(roleStr);
        } catch (IllegalArgumentException e) {
            System.out.println("Неверная роль. Установлена USER.");
            role = UserRole.USER;
        }
        try {
            User u = userService.register(username, password, role);
            System.out.println("Пользователь создан. ID=" + u.getId());
        } catch (IllegalArgumentException e) {
            System.out.println("Ошибка: " + e.getMessage());
        }
    }

    private boolean requireAdmin() {
        if (currentUser.getRole() != UserRole.ADMIN) {
            System.out.println("Требуются права администратора.");
            return false;
        }
        return true;
    }

    private Tournament selectTournament() {
        List<Tournament> list = tournamentService.getAll();
        if (list.isEmpty()) {
            System.out.println("Турниров нет.");
            return null;
        }
        for (int i = 0; i < list.size(); i++) {
            System.out.println((i+1) + ". " + list.get(i).getName());
        }
        int idx = readInt("Выберите турнир: ") - 1;
        if (idx < 0 || idx >= list.size()) {
            System.out.println("Неверный выбор.");
            return null;
        }
        return list.get(idx);
    }

    private Match selectMatch() {
        List<Match> list = matchService.getAllMatches();
        if (list.isEmpty()) {
            System.out.println("Матчей нет.");
            return null;
        }
        for (int i = 0; i < list.size(); i++) {
            System.out.println((i + 1) + ". " + "Матч команд " + list.get(i).getTeam1() + " и " + list.get(i).getTeam2());
        }
        int idx = readInt("Выберите матч: ") - 1;
        if (idx < 0 || idx >= list.size()) {
            System.out.println("Неверный выбор.");
            return null;
        }
        return list.get(idx);
    }

    private void printMatches(List<Match> list) {
        if (list.isEmpty()) {
            System.out.println("Матчей не найдено.");
            return;
        }
        for (Match m : list) {
            Tournament tournament = m.getTournament();
            String team1 = m.getTeam1();
            String team2 = m.getTeam2();
            String matchDate = m.getMatchDate().format(DATETIME_FMT);
            TournamentStage stage = m.getStage();
            MatchStatus status = m.getStatus();
            int score1 = m.getScore1();
            int score2 = m.getScore2();

            if (status == MatchStatus.SCHEDULED) {
                System.out.println("Матч команд " + team1 + " и " + team2 + " запланирован на " + matchDate + " стадии " +
                        stage + "\n" + "Турнир: " + tournament.getName());
                System.out.println("===============");
            }
            else if (status == MatchStatus.CANCELLED) {
                System.out.println("Матч команд " + team1 + " и " + team2 + " отменён" + "\n" + "Турнир: " + tournament.getName());
                System.out.println("===============");
            }
            else if (status == MatchStatus.FINISHED) {
                System.out.println("Матч команд " + team1 + " и " + team2 + " завершён со счётом " + score1 + ":" + score2
                        + "\n" + "Турнир: " + tournament.getName());
                System.out.println("===============");
            }
            else if (status == MatchStatus.LIVE) {
                System.out.println("Матч команд " + team1 + " и " + team2 + " идёт со счётом " + score1 + ":" + score2
                        + "\n" + "Турнир: " + tournament.getName());
                System.out.println("===============");
            }
        }
    }

        private static final int MAX_INPUT_LENGTH = 100;
    private static final int MAX_SAFE_INT = 100_000;

    private String readLineSafe(String prompt) {
        while (true) {
            System.out.print(prompt);
            String line = scanner.nextLine();
            if (line.length() > MAX_INPUT_LENGTH) {
                System.out.println("Ошибка: Неверный ввод (слишком длинное предложение, лимит " + MAX_INPUT_LENGTH + " символов). Ввод сброшен.");
                continue;
            }
            return line.trim();
        }
    }

    private int readInt(String prompt) {
        while (true) {
            String line = readLineSafe(prompt);
            if (line.length() > 6) {
                System.out.println("Ошибка: Неверный ввод (число слишком большое). Ввод сброшен.");
                continue;
            }
            try {
                int val = Integer.parseInt(line);
                if (val < 0 || val > MAX_SAFE_INT) {
                    System.out.println("Ошибка: Неверный ввод (число вне допустимого диапазона).");
                    continue;
                }
                return val;
            } catch (NumberFormatException e) {
                System.out.println("Ошибка: Неверный ввод. Введите целое число.");
            }
        }
    }

    private String readNonEmpty(String prompt) {
        while (true) {
            String line = readLineSafe(prompt);
            if (!line.isEmpty()) return line;
            System.out.println("Ошибка: Неверный ввод. Поле не может быть пустым.");
        }
    }

    private LocalDate readDate(String prompt) {
        while (true) {
            System.out.print(prompt);
            String line = scanner.nextLine().trim();
            try {
                return LocalDate.parse(line, DATE_FMT);
            } catch (DateTimeParseException e) {
                System.out.println("Неверный формат даты.");
            }
        }
    }

    private LocalDateTime readDateTime(String prompt) {
        while (true) {
            System.out.print(prompt);
            String line = scanner.nextLine().trim();
            try {
                return LocalDateTime.parse(line, DATETIME_FMT);
            } catch (DateTimeParseException e) {
                System.out.println("Неверный формат даты и времени.");
            }
        }
    }

    private TournamentStage readStage() {
        while (true) {
            System.out.print("Этап (GROUP/QUARTER_FINAL/SEMI_FINAL/FINAL): ");
            String line = scanner.nextLine().trim().toUpperCase();
            try {
                return TournamentStage.valueOf(line);
            } catch (IllegalArgumentException e) {
                System.out.println("Неверный этап.");
            }
        }
    }
}