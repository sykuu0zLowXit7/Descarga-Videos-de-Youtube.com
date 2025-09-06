// Importamos las librerías necesarias
const express = require('express');
const cors = require('cors');
const ytdl = require('@distube/ytdl-core');
const app = express();
const port = 3000;

// Middleware para procesar JSON y habilitar CORS
app.use(express.json());
app.use(cors());

// Ruta para obtener información del video
app.post('/info', async (req, res) => {
    try {
        const { url } = req.body;
        if (!ytdl.validateURL(url)) {
            return res.status(400).send('URL de YouTube inválida');
        }

        const info = await ytdl.getInfo(url);
        const videoDetails = info.videoDetails;

        const videoOnlyFormats = [];
        const videoWithAudioFormats = [];
        
        const videoOnlySeen = new Set();
        const videoWithAudioSeen = new Set();

        info.formats.forEach(format => {
            if (format.hasVideo && format.hasAudio && format.qualityLabel && !videoWithAudioSeen.has(format.qualityLabel)) {
                videoWithAudioFormats.push({ quality: format.qualityLabel, itag: format.itag });
                videoWithAudioSeen.add(format.qualityLabel);
            }
            if (format.hasVideo && !format.hasAudio && format.qualityLabel && !videoOnlySeen.has(format.qualityLabel)) {
                videoOnlyFormats.push({ quality: format.qualityLabel, itag: format.itag });
                videoOnlySeen.add(format.qualityLabel);
            }
        });
        
        const highQualityThumbnail = videoDetails.thumbnails[videoDetails.thumbnails.length - 1];

        res.json({
            title: videoDetails.title,
            thumbnail: highQualityThumbnail.url,
            videoUrl: videoDetails.embed.iframeUrl,
            videoWithAudio: videoWithAudioFormats,
            videoOnly: videoOnlyFormats
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Ocurrió un error al obtener la información del video.');
    }
});

// Ruta para iniciar la descarga del video
app.get('/download', async (req, res) => {
    try {
        const { url, itag } = req.query;

        res.header('Content-Disposition', `attachment; filename="video.mp4"`);
        ytdl(url, { quality: itag }).pipe(res);

    } catch (err) {
        console.error(err);
        res.status(500).send('Ocurrió un error al iniciar la descarga.');
    }
});

// Iniciamos el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});