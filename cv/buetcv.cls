%% buetcv.cls — academic CV class producing a short CV or a full dossier.
%%
%% Usage:  \documentclass{buetcv}            short CV
%%         \documentclass[dossier]{buetcv}   full dossier (\ifdossier is true)
%%
%% Design rationale: docs/cv-redesign/. Requires LuaLaTeX + Biber.
%%
%% The original entry layout was derived from RenderCV
%% (MIT License, Copyright (c) 2023 Sina Atalay and contributors);
%% Copyright (c) 2024-2026 Sajid Muhaimin Choudhury. Released under the MIT License.
\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{buetcv}[2026/10/04 v2.0 Academic CV: short CV and full dossier]

\newif\ifdossier
\DeclareOption{dossier}{\dossiertrue}
\DeclareOption*{\PassOptionsToClass{\CurrentOption}{article}}
\ProcessOptions\relax
\LoadClass[11pt, a4paper]{article}

% ─── Engine, page, language ────────────────────────────────────────────────
\RequirePackage{iftex}
\RequireLuaTeX
\RequirePackage[a4paper, top=1.7cm, bottom=2.2cm, left=2.2cm, right=2.2cm,
                footskip=1cm]{geometry}
\RequirePackage[british]{babel}            % hyphenation; \today = "4 October 2026"
\RequirePackage{etoolbox}

% ─── Typography ────────────────────────────────────────────────────────────
\RequirePackage{fontspec}
\setmainfont{LibertinusSerif}[
  Extension = .otf, UprightFont = *-Regular, ItalicFont = *-Italic,
  BoldFont = *-Semibold, BoldItalicFont = *-SemiboldItalic]
\setsansfont{LibertinusSans}[
  Extension = .otf, UprightFont = *-Regular, ItalicFont = *-Italic, BoldFont = *-Bold]
\setmonofont{LibertinusMono-Regular.otf}
\RequirePackage{unicode-math}               % math in paper titles ($\mu$m, [[7,1,3]])
\setmathfont{LibertinusMath-Regular.otf}
\RequirePackage{microtype}
\RequirePackage{fontawesome5}
\RequirePackage{academicons}
\setlength{\parindent}{0pt}
\setlength{\parskip}{0pt}
\frenchspacing
\raggedbottom

% ─── Colour (website design tokens, docs/redesign/design-system-proposal.md) ─
\RequirePackage{xcolor}
\definecolor{cvaccent}{HTML}{0E7490}   % accent, 5.36:1 on white
\definecolor{cvtext}{HTML}{0F172A}     % text-primary
\definecolor{cvgrey}{HTML}{475569}     % text-secondary
\definecolor{cvrule}{HTML}{CBD5E1}     % border-strong
\AtBeginDocument{\color{cvtext}}

% ─── Links and PDF metadata ────────────────────────────────────────────────
\RequirePackage{hyperref}
\hypersetup{colorlinks=true, linkcolor=cvtext, urlcolor=cvaccent,
            citecolor=cvaccent, pdfcreator={LuaLaTeX (buetcv)}}
\urlstyle{same}
\RequirePackage{bookmark}
\RequirePackage{lastpage}

% ─── Person and document type (set in the document preamble) ──────────────
\newcommand*{\cvname}{}
\newcommand*{\cvshortname}{}
\newcommand*{\cvperson}[2]{\renewcommand*{\cvname}{#1}\renewcommand*{\cvshortname}{#2}}
% "4 October 2026" (babel's British \today gives "4th October 2026")
\newcommand*{\cvtoday}{\number\day\space\ifcase\month\or January\or February\or
  March\or April\or May\or June\or July\or August\or September\or October\or
  November\or December\fi\space\number\year}
\newcommand*{\cvdoctype}{\ifdossier Curriculum Vitae\texorpdfstring{\,\textperiodcentered\,}{ - }Full Dossier\else Curriculum Vitae\fi}
\AtBeginDocument{\hypersetup{pdftitle={\cvname\space - \cvdoctype}, pdfauthor={\cvname}}}

% ─── Header and footer ─────────────────────────────────────────────────────
\RequirePackage{fancyhdr}
\fancypagestyle{cv}{%
  \fancyhf{}%
  \renewcommand{\headrulewidth}{0pt}%
  \fancyfoot[L]{\footnotesize\color{cvgrey}\cvshortname\enspace\textperiodcentered\enspace\cvdoctype}%
  \fancyfoot[R]{\footnotesize\color{cvgrey}page \thepage\ of \pageref*{LastPage}}}
\pagestyle{cv}

% \cvheader{<name>}{<position line>}{<contact line>}
\newcommand{\cvheader}[3]{%
  {\footnotesize\color{cvgrey}\textls[60]{\MakeUppercase{\cvdoctype}}\hfill
   Last updated \cvtoday\par}%
  \vspace{10pt}%
  {\fontsize{25}{29}\selectfont\bfseries #1\par}%
  \vspace{4pt}%
  {\large\color{cvgrey}#2\par}%
  \vspace{7pt}%
  {\small\color{cvgrey}#3\par}%
  \vspace{5pt}%
  {\color{cvaccent}\rule{\linewidth}{0.8pt}}\par
  \vspace{2pt}}
% \cvcontact{<icon>}{<url>}{<text>}; separate entries with \cvsep
\newcommand{\cvcontact}[3]{\mbox{\href{#2}{\color{cvgrey}{\footnotesize #1}\hspace{0.35em}#3}}}
\newcommand{\cvsep}{\hspace{1.1em}\allowbreak}

% ─── Section headings ──────────────────────────────────────────────────────
\RequirePackage[explicit]{titlesec}
\RequirePackage{needspace}
\titleformat{\section}
  {\needspace{5\baselineskip}\large\bfseries\color{cvaccent}}{}{0pt}
  {#1\hspace{0.6em}{\color{cvrule}\titlerule[0.5pt]}}
\titlespacing*{\section}{0pt}{15pt plus 3pt minus 2pt}{7pt}
\titleformat{\subsection}
  {\needspace{3\baselineskip}\normalsize\bfseries}{}{0pt}{#1}
\titlespacing*{\subsection}{0pt}{9pt plus 2pt}{3pt}
\setcounter{secnumdepth}{0}

% ─── Grid: date/label column + content column ──────────────────────────────
\newlength{\cvdatewidth}
\setlength{\cvdatewidth}{3.5cm}          % date column including the gutter
\newlength{\cvgutter}
\setlength{\cvgutter}{0.3cm}
\newlength{\cvitemsep}
\setlength{\cvitemsep}{5pt}
\newcommand*{\cvdatefont}{\small\color{cvgrey}}
\newcommand*{\cvmeta}[1]{{\small\color{cvgrey}#1}}

% \cvitem{<date or label>}{<content>} — one dated entry on the grid
\newcommand{\cvitem}[2]{%
  \par\noindent
  % \leavevmode first: a leading \color would become the minipage's top
  % "line" and push the text below the [t] baseline.
  \begin{minipage}[t]{\dimexpr\cvdatewidth-\cvgutter\relax}\raggedright\leavevmode\cvdatefont #1\end{minipage}%
  \hspace{\cvgutter}%
  \begin{minipage}[t]{\dimexpr\linewidth-\cvdatewidth\relax}\leavevmode #2\end{minipage}%
  \par\vspace{\cvitemsep}}
% \cvgroup{<heading>} — an un-dated heading in the content column
\newcommand{\cvgroup}[1]{%
  \par\needspace{3\baselineskip}\noindent\hspace*{\cvdatewidth}\textbf{#1}\par\vspace{3pt}}
% cvblock — free text (paragraphs, lists) in the content column; may break across pages
\newenvironment{cvblock}
  {\list{}{\setlength{\leftmargin}{\cvdatewidth}\setlength{\rightmargin}{0pt}%
           \setlength{\topsep}{0pt}\setlength{\partopsep}{0pt}%
           \setlength{\parsep}{5pt}\setlength{\itemsep}{0pt}}\item\relax}
  {\endlist\vspace{\cvitemsep}}

% ─── Lists ─────────────────────────────────────────────────────────────────
\RequirePackage{enumitem}
\newlist{cvlist}{itemize}{2}
\setlist[cvlist,1]{label={\textcolor{cvaccent}{\small\textbullet}}, leftmargin=1.1em,
                   topsep=2pt, itemsep=2pt, parsep=0pt, partopsep=0pt}
\setlist[cvlist,2]{label={\textcolor{cvgrey}{--}}, leftmargin=1.1em,
                   topsep=1pt, itemsep=1pt, parsep=0pt}

% ─── Citation metrics panel (data from metrics.tex, written by Python) ─────
\RequirePackage{pgfplots}
\pgfplotsset{compat=1.18}
\newcommand*{\cv@bignumber}[2]{%
  \begin{tabular}[b]{@{}l@{}}
    {\fontsize{19}{21}\selectfont\bfseries\color{cvaccent}#1}\\[1pt]
    {\footnotesize\color{cvgrey}#2}
  \end{tabular}}
\newcommand{\cvmetricspanel}{%
  \par\noindent
  \begin{minipage}[b]{0.44\linewidth}
    \cv@bignumber{\gsCitations}{citations}\hfill
    \cv@bignumber{\gsHindex}{h-index}\hfill
    \cv@bignumber{\gsIten}{i10-index}
  \end{minipage}\hfill
  \begin{minipage}[b]{0.5\linewidth}
    \begin{tikzpicture}
      \begin{axis}[
          width=\linewidth, height=3.3cm, scale only axis=false,
          ybar, bar width=9pt, bar shift=0pt, ymin=0,
          enlarge x limits=0.07, enlarge y limits={upper, value=0.22},
          axis x line*=bottom, axis y line=none,
          xtick=\gsYearTicks, xticklabel style={font=\scriptsize\color{cvgrey}},
          % print numbers in the text font, not math mode (Computer Modern)
          xticklabel={\pgfmathprintnumber[assume math mode=true, 1000 sep=]{\tick}},
          major tick length=0pt, axis line style={draw=cvrule},
          nodes near coords={\pgfmathprintnumber[assume math mode=true]{\pgfplotspointmeta}},
          every node near coord/.append style={font=\tiny\color{cvgrey}},
          title={\footnotesize\color{cvgrey}citations per year},
          title style={yshift=-4pt}]
        \addplot[fill=cvaccent, draw=none] table[x=year, y=cites] {\gsFullYears};
        \addplot[fill=cvaccent!35, draw=none] table[x=year, y=cites] {\gsPartialYear};
      \end{axis}
    \end{tikzpicture}
  \end{minipage}\par
  \vspace{2pt}
  {\footnotesize\color{cvgrey}Google Scholar via Publish or Perish, retrieved \gsRetrieved.
   \gsCurrentYear\ is year to date.\par}}

% ─── Bibliography ──────────────────────────────────────────────────────────
\RequirePackage[autostyle]{csquotes}
\RequirePackage[
    backend=biber, style=ext-numeric, datamodel=buetcv,
    articlein=false, giveninits=false, maxbibnames=99, maxcitenames=99,
    sorting=ydnt, defernumbers=true, isbn=false,
    doi=false, url=false, eprint=false   % printed by cv:links+metrics instead
]{biblatex}
\renewcommand*{\bibfont}{\small}
% Titles write "1.55\mu{m}" outside math; with unicode-math that would ask the
% text font for U+1D707 (math italic mu), which it lacks. Use the text micro
% sign (U+00B5) there; inside $...$ keep the math mu.
\AtBeginBibliography{%
  \let\cv@mathmu\mu
  \renewcommand*{\mu}{\ifmmode\cv@mathmu\else\textmu\fi}}
\setlength{\bibitemsep}{4pt}
\setlength{\biblabelsep}{0.8em}
\DeclareFieldFormat{labelnumberwidth}{\textcolor{cvaccent}{\mkbibbold{#1}}}
\DeclareFieldFormat{doi}{\href{https://doi.org/#1}{doi:\nolinkurl{#1}}}
\DeclareFieldFormat{url}{\url{#1}}
\DeclareFieldFormat{citationnos}{cited~#1}
\DeclareFieldFormat{sjr}{SJR~#1}
\DeclareFieldFormat{jif}{IF~#1}

% Second line of every entry: link and metrics in small grey, "·" separated.
\newtoggle{cv@firstmetric}
\newcommand*{\cv@metric}[1]{%
  \iftoggle{cv@firstmetric}{\global\togglefalse{cv@firstmetric}}{\enspace\textperiodcentered\enspace}#1}
\newbibmacro*{cv:links+metrics}{%
  \global\toggletrue{cv@firstmetric}%
  \par\nopagebreak
  {\footnotesize\color{cvgrey}%
   \iffieldundef{doi}
     {\iffieldundef{url}{}{\cv@metric{\printfield{url}}}}
     {\cv@metric{\printfield{doi}}}%
   \iffieldundef{citationnos}{}
     {\ifnumgreater{\thefield{citationnos}}{0}{\cv@metric{\printfield{citationnos}}}{}}%
   \iffieldundef{sjr}{}{\cv@metric{\printfield{sjr}}}%
   \iffieldundef{jif}{}{\cv@metric{\printfield{jif}}}}}
\renewbibmacro*{finentry}{\finentry\usebibmacro{cv:links+metrics}}

% Reverse numbering within each list (newest = highest number): a first,
% silent pass counts the entries of a type, then labels count down.
\defbibenvironment{counter}
  {\renewcommand{\blx@driver}[1]{}}
  {}
  {\csnumgdef{entrycount}{\csuse{entrycount}+1}}
\DeclareFieldFormat{labelnumber}{\mkbibdesc{#1}}
\newrobustcmd*{\mkbibdesc}[1]{\number\numexpr\csuse{entrycount}+1-#1\relax}

% \pubsection{<entry type>}{<label prefix>}{<heading>}
\newcommand*{\pubsection}[3]{%
  \subsection{#3}%
  \csnumgdef{entrycount}{0}%
  \newrefcontext[labelprefix=#2]%
  \setbox0=\vbox{\printbibliography[env=counter, type=#1, heading=none]}% count only
  \printbibliography[type=#1, heading=none]}

% ─── Own name in bold, supervised students marked † (automatic) ───────────
% \cvselfname{<family>}{<initial of first given name>} matches every spelling
% of the owner's name in the .bib ("Sajid Muhaimin Choudhury", "S. M. Choudhury",
% "Choudhury, Sajid Muhaimin", "SM Choudhury", ...), but not a co-author with
% the same family name and a different initial.
% \cvstudent{<family>}{<given-name fragment>} marks a supervised student.
\ExplSyntaxOn
\tl_new:N \g__cv_self_family_tl
\tl_new:N \g__cv_self_initial_tl
\seq_new:N \g__cv_students_seq
\bool_new:N \l__cv_student_bool
\NewDocumentCommand \cvselfname { m m }
  {
    \tl_gset:Nn \g__cv_self_family_tl {#1}
    \tl_gset:Nn \g__cv_self_initial_tl {#2}
  }
\NewDocumentCommand \cvstudent { m m }
  { \seq_gput_right:Nn \g__cv_students_seq { {#1}{#2} } }
\prg_new_conditional:Npnn \__cv_if_self: { TF }
  {
    \bool_if:nTF
      {
        \cs_if_exist_p:N \namepartfamily
        && \cs_if_exist_p:N \namepartgiveni
        && \tl_if_eq_p:NN \namepartfamily \g__cv_self_family_tl
        && \str_if_eq_p:ee { \exp_args:No \tl_head:n { \namepartgiveni } }
                           { \g__cv_self_initial_tl }
      }
      { \prg_return_true: } { \prg_return_false: }
  }
\cs_new_protected:Npn \__cv_test_student:nn #1#2
  {
    \tl_if_eq:NnT \namepartfamily {#1}
      {
        \tl_if_in:NnT \namepartgiven {#2}
          { \bool_set_true:N \l__cv_student_bool \seq_map_break: }
      }
  }
\NewDocumentCommand \cvmarkname { m }
  {
    \bool_set_false:N \l__cv_student_bool
    \bool_lazy_and:nnT
      { \cs_if_exist_p:N \namepartfamily } { \cs_if_exist_p:N \namepartgiven }
      { \seq_map_inline:Nn \g__cv_students_seq { \__cv_test_student:nn ##1 } }
    \__cv_if_self:TF
      { \textbf{#1} }
      { #1 \bool_if:NT \l__cv_student_bool { \textsuperscript{\dag} } }
  }
\ExplSyntaxOff
\renewcommand*{\mkbibcompletename}[1]{\cvmarkname{#1}}

\endinput
