# C0DΞX HUB Mobile

Aplicação SPA offline-first para iOS/Safari/Atalhos, separada em três módulos:

- `ModCSS.css`: somente estilos.
- `ModHTML.html`: somente estrutura interna do `<body>`.
- `ModJS.js`: somente lógica.
- `index.html`: versão final já montada para teste imediato.

## PIN inicial

`1234`

Altere em Configurações.

## Observações técnicas

- Não usa CDN.
- Usa `localStorage` para estado local.
- Exporta/importa backup físico em JSON.
- IA e n8n estão preparados como configuração futura, sem dependência para o funcionamento principal.
- A busca Wiki Delphi é local/cacheada em PT-BR e salva estudos no Vault.
- Compartilhamento usa `wa.me/?text=...` para texto, pois link de convite de grupo do WhatsApp não injeta mensagem diretamente no grupo.

MIT License  
Danilo | Desenvolvedor | Delphi
