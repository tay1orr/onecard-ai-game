// ONE! 시즌 2 — 시작점
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import '@fontsource/big-shoulders-display/latin-700';
import '@fontsource/big-shoulders-display/latin-800';
import '@fontsource/big-shoulders-display/latin-900';
import './styles/tokens.css';
import './styles/base.css';
import './styles/lobby.css';
import './styles/game.css';
import './styles/cards.css';
import './styles/fx.css';
import './styles/pages.css';
import { createApp } from './ui/app.js';

createApp(document.getElementById('app'));
