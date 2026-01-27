# IPTV Link Scanner

En webbaserad scanner för att hitta fungerande IPTV-länkar.

🌐 **Live Demo**: https://kuribaxi.github.io/iptv-scanner/

## Funktioner

- ✅ Testa IPTV-länkar direkt i webbläsaren
- ✅ Inget server-behov - allt körs lokalt
- ✅ Parallell scanning med flera trådar
- ✅ Visa realtidsresultat
- ✅ Kopiera länkar till urklipp
- ✅ Responsiv design för alla enheter
- ✅ Förinställda testintervall

## Användning

1. Öppna [hemsidan](https://kuribaxi.github.io/iptv-scanner)
2. Ange start- och slutnummer (t.ex. 6140-6180)
3. Välj vilka filtyper som ska testas (1.m3u8, 2.m3u8, etc.)
4. Klicka på "Starta Scanning"
5. Vänta medan länkarna testas
6. Kopiera fungerande länkar med kopieringsknappen

## Rekommenderade intervall

Baserat på kända fungerande länkar:
- **6140-6180**: Många fungerande länkar
- **6637-6902**: Flera spridda länkar
- **7000-7023**: Sista gruppen av länkar

## Teknisk information

Denna sida använder:
- Vanilla JavaScript för scanning
- CORS proxy för att testa länkar
- Bootstrap 5 för styling
- GitHub Pages för hosting

## Installation lokalt

```bash
git clone https://github.com/kuribaxi/iptv-scanner.git
cd iptv-scanner
# Öppna index.html i webbläsaren
