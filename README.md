# AI Study Assistant

 **[Aplicație live](https://study-assistant-seven-taupe.vercel.app)** |  **[Video demonstrativ](https://youtu.be/HeM4L4DB53M)** 

AI Study Assistant este o aplicație web care ajută studenții să învețe mai eficient. Utilizatorul lipește text din cursuri sau notițe, iar aplicația generează automat un rezumat structurat sau un test grilă cu 5 întrebări, folosind inteligența artificială. Rezultatele sunt salvate per utilizator în cloud și pot fi accesate oricând.
Studenții petrec mult timp citind și sintetizând materiale de studiu. Aplicația rezolvă această problemă prin automatizarea procesului de rezumare și testare, permițând o pregătire mai rapidă și mai eficientă pentru examene. Utilizatorul are nevoie doar să copieze textul din curs, iar AI-ul face restul.

Descriere API

Aplicația folosește două servicii cloud externe prin API REST:

OpenAI API
- **Scop:** Generare rezumate și întrebări grilă din text
- **Endpoint folosit:** `POST https://api.openai.com/v1/chat/completions`
- **Model:** `gpt-3.5-turbo`

Firebase (Google Cloud)
- **Firebase Authentication** — autentificare utilizatori (email/parolă + Google OAuth)
- **Cloud Firestore** — stocare istoric rezumate și teste per utilizator
- **Autentificare:** Firebase SDK cu API Key și configurație de proiect

Flux de date

```
Utilizator → React (Vercel)
                ↓
         Express Server (Render)
                ↓
          OpenAI API (GPT-3.5)
                ↓
         Răspuns → React
                ↓
         Firestore (salvare)
```

**Pași:**
1. Utilizatorul se autentifică prin Firebase Authentication
2. Utilizatorul introduce text și apasă Generate Summary sau Generate Quiz
3. Frontend-ul trimite un request POST la serverul Express
4. Serverul apelează OpenAI API și returnează rezultatul
5. Rezultatul este afișat și salvat automat în Firestore

Autentificare și autorizare
- **Firebase Authentication** gestionează sesiunile utilizatorilor; token-ul JWT este emis de Firebase și persistat local în browser
- **OpenAI API** folosește API Key stocată ca variabilă de mediu pe serverul Render (nu este expusă în codul sursă)
- **Firestore Rules** permit citirea/scrierea doar utilizatorilor autentificați

 Referințe

- [React](https://react.dev)
- [Vite](https://vitejs.dev)
- [Firebase Documentation](https://firebase.google.com/docs)
- [OpenAI API](https://platform.openai.com/docs)
- [Express.js](https://expressjs.com)
- [Vercel](https://vercel.com)
- [Render](https://render.com)
- [Tailwind CSS](https://tailwindcss.com)
