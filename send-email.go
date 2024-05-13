package main

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/smtp"
	"os"
	"path/filepath"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

var (
	googleOauthConfig  *oauth2.Config
	oauthStateString   = "pseudo-random"
	usuariosCollection *mongo.Collection
)

const htmlIndex = `<html><body>
Logged in with Google <a href="/logout">logout</a>
</body></html>
`

func init() {
	googleOauthConfig = &oauth2.Config{
		RedirectURL:  "http://localhost:8081/callback",
		ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		Scopes:       []string{"https://www.googleapis.com/auth/userinfo.email"},
		Endpoint:     google.Endpoint,
	}

	// Configuración de la conexión a MongoDB
	clientOptions := options.Client().ApplyURI("mongodb://localhost:27017")
	client, err := mongo.Connect(context.Background(), clientOptions)
	if err != nil {
		log.Fatal("Error de conexión a MongoDB:", err)
	}

	usuariosDB := client.Database("usuarios")
	usuariosCollection = usuariosDB.Collection("usuarios")
}

func main() {
	http.HandleFunc("/", handleMain)
	http.HandleFunc("/login", handleGoogleLogin)
	http.HandleFunc("/logout", handleLogout)
	http.HandleFunc("/callback", handleGoogleCallback)
	http.HandleFunc("/reset-password", handlePasswordReset)
	http.HandleFunc("/reset_password.html", handleResetPasswordHTML)
	http.HandleFunc("/reset_password.js", handleResetPasswordJS)

	// Directorio para servir archivos estáticos
	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))

	fmt.Println("Server started on http://localhost:8081")
	http.ListenAndServe(":8081", addCORSHeaders(http.DefaultServeMux))
}

func handleMain(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, htmlIndex)
}

func handleGoogleLogin(w http.ResponseWriter, r *http.Request) {
	url := googleOauthConfig.AuthCodeURL(oauthStateString)
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

func handleGoogleCallback(w http.ResponseWriter, r *http.Request) {
	state := r.FormValue("state")
	if state != oauthStateString {
		fmt.Println("invalid oauth state")
		http.Error(w, "invalid oauth state", http.StatusBadRequest)
		return
	}

	code := r.FormValue("code")
	token, err := googleOauthConfig.Exchange(r.Context(), code)
	if err != nil {
		fmt.Println("code exchange failed:", err)
		http.Error(w, "code exchange failed", http.StatusInternalServerError)
		return
	}

	userInfo, err := getUserInfo(token)
	if err != nil {
		fmt.Println("failed to get user info:", err)
		http.Error(w, "failed to get user info", http.StatusInternalServerError)
		return
	}

	// Redirigir al usuario a la página reset_password.html
	http.Redirect(w, r, "/reset_password.html", http.StatusFound)

	// Devolver la información del usuario como JSON
	response := struct {
		Email string `json:"email"`
	}{
		Email: userInfo.Email,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func handleLogout(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r, "/", http.StatusTemporaryRedirect)
}

func handlePasswordReset(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var requestData struct {
		Email string `json:"email"`
	}

	if err := json.NewDecoder(r.Body).Decode(&requestData); err != nil {
		fmt.Println("failed to decode request body:", err)
		http.Error(w, "failed to decode request body", http.StatusBadRequest)
		return
	}

	email := requestData.Email
	if email == "" {
		http.Error(w, "missing email parameter", http.StatusBadRequest)
		return
	}

	// Lógica para generar un token de restablecimiento de contraseña
	token := generarToken()

	// Guardar el token en el campo resetPasswordToken del usuario correspondiente
	err := guardarTokenUsuario(email, token)
	if err != nil {
		fmt.Println("Error al guardar el token del usuario:", err)
		http.Error(w, "Error al guardar el token del usuario", http.StatusInternalServerError)
		return
	}

	// Envío de correo electrónico
	err = enviarCorreo(email, token)
	if err != nil {
		fmt.Println("Error al enviar el correo electrónico:", err)
		http.Error(w, "Error al enviar el correo electrónico", http.StatusInternalServerError)
		return
	}

	// Respuesta al cliente
	response := struct {
		Message string `json:"message"`
	}{
		Message: "Correo electrónico de restablecimiento de contraseña enviado correctamente",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func getUserInfo(token *oauth2.Token) (*UserInfo, error) {
	resp, err := http.Get("https://www.googleapis.com/oauth2/v2/userinfo?access_token=" + token.AccessToken)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var userInfo UserInfo
	if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
		return nil, err
	}
	return &userInfo, nil
}

type UserInfo struct {
	Email string `json:"email"`
}

func generarToken() string {
	// Longitud del token
	tokenLength := 32

	// Crear un slice de bytes para almacenar el token generado
	token := make([]byte, tokenLength)

	// Leer bytes aleatorios desde el generador criptográfico seguro
	_, err := rand.Read(token)
	if err != nil {
		fmt.Println("Error al generar el token:", err)
		return ""
	}

	// Codificar el token en base64 para obtener una cadena legible
	tokenStr := base64.URLEncoding.EncodeToString(token)

	return tokenStr
}

func enviarCorreo(destinatario, token string) error {
	// Datos de autenticación del servidor SMTP
	smtpHost := "smtp.gmail.com"
	smtpPort := "587"
	smtpUsername := "buscacohetesa1@gmail.com"
	smtpPassword := "vkxg jtwm ihlr eakk"

	// Dirección de correo electrónico del remitente
	from := "buscacohetesa1@gmail.com"

	// URL de reset_password.html con el token como parámetro
	resetURL := fmt.Sprintf("http://localhost:8081/reset_password.html?token=%s", token)

	// Mensaje de correo electrónico
	subject := "Recuperación de contraseña"
	body := fmt.Sprintf("Hola,\n\nHaz clic en el siguiente enlace para restablecer tu contraseña:\n\n%s\n\nSaludos,\nTu aplicación", resetURL)

	// Configurar autenticación y servidor SMTP
	auth := smtp.PlainAuth("", smtpUsername, smtpPassword, smtpHost)

	// Establecer el contenido del mensaje
	msg := []byte("To: " + destinatario + "\r\n" +
		"Subject: " + subject + "\r\n" +
		"\r\n" +
		body + "\r\n")

	// Enviar correo electrónico
	err := smtp.SendMail(smtpHost+":"+smtpPort, auth, from, []string{destinatario}, msg)
	if err != nil {
		fmt.Println("Error al enviar el correo electrónico:", err)
		return err
	}

	fmt.Println("Correo electrónico enviado correctamente")
	return nil
}

func handleResetPasswordHTML(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "reset_password.html")
}

func handleResetPasswordJS(w http.ResponseWriter, r *http.Request) {
	// Cargar el archivo JavaScript
	jsPath := filepath.Join(".", "reset_password.js")
	http.ServeFile(w, r, jsPath)
}

func addCORSHeaders(handler http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Permitir solicitudes desde cualquier origen con los métodos GET, POST y OPTIONS
		w.Header().Set("Access-Control-Allow-Origin", r.Header.Get("Origin"))
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		// Si es una solicitud OPTIONS, termina aquí y responde con éxito
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		// Continuar con el siguiente manejador
		handler.ServeHTTP(w, r)
	})
}

func guardarTokenUsuario(email, token string) error {
	// Establecer la fecha de expiración del token
	expirationTime := time.Now().Add(24 * time.Hour)

	// Filtrar el usuario por su dirección de correo electrónico
	filter := bson.M{"email": email}

	// Crear un documento de actualización para establecer el token y la fecha de expiración
	update := bson.M{
		"$set": bson.M{
			"resetPasswordToken":      token,
			"resetPasswordExpiration": expirationTime,
		},
	}

	// Actualizar el usuario en la base de datos
	_, err := usuariosCollection.UpdateOne(context.Background(), filter, update)
	if err != nil {
		return err
	}

	return nil
}
