% buetcv.sty
% this is my first package
% 
% (c) Buffalo Bill
%
%% This program can be redistributed and/or modified under the terms
%% of the LaTeX Project Public License Distributed from CTAN archives
%% in directory macros/latex/base/lppl.txt.
% 

% MIT License
% 
% Copyright (c) 2023 to present Sina Atalay and individual contributors for RenderCV
% Copyright (c) 2024 to Dr. Sajid Muhaimin Choudhury
% Permission is hereby granted, free of charge, to any person obtaining a copy
% of this software and associated documentation files (the "Software"), to deal
% in the Software without restriction, including without limitation the rights
% to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
% copies of the Software, and to permit persons to whom the Software is
% furnished to do so, subject to the following conditions:
%
% The above copyright notice and this permission notice shall be included in all
% copies or substantial portions of the Software.
% 
% THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
% IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
% FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
% AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
% LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
% OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
% SOFTWARE.


  \NeedsTeXFormat{LaTeX2e}
\ProvidesClass{buetcv}[2024/09/11 Example LaTeX class]


\LoadClass[10pt, letterpaper]{article}


% Packages:
\RequirePackage[
    ignoreheadfoot, % set margins without considering header and footer
    top=2 cm, % seperation between body and page edge from the top
    bottom=2 cm, % seperation between body and page edge from the bottom
    left=2 cm, % seperation between body and page edge from the left
    right=2 cm, % seperation between body and page edge from the right
    footskip=1.0 cm, % seperation between body and footer
    % showframe % for debugging 
]{geometry} % for adjusting page geometry
\RequirePackage[explicit]{titlesec} % for customizing section titles
\RequirePackage{tabularx} % for making tables with fixed width columns
\RequirePackage{array} % tabularx requires this
\RequirePackage[dvipsnames]{xcolor} % for coloring text
\RequirePackage{booktabs}
\RequirePackage{subcaption}
\RequirePackage{pgfplots}
\RequirePackage{longtable}
\pgfplotsset{compat=1.18}

\definecolor{primaryColor}{RGB}{0, 0, 0} 
% BUET color
%\definecolor{primaryColor}{RGB}{172, 31, 24} % define primary color
\RequirePackage{enumitem} % for customizing lists
\RequirePackage{fontspec}          % Unicode font loader
\RequirePackage{fontawesome5} % for using icons
\RequirePackage{academicons}
\RequirePackage{amsmath} % for math


\def\cvauthor{Dr. Sajid Muhaimin Choudhury}%
\def\docdate{\today}%


\define@key{buetcv.cls}{docdate}[\today]{%
  \def\docdate{#1}%
}

\define@key{buetcv.cls}{cvauthor}[A. U. Thor]{%
  \def\docauthorname{#1}%
}

\usepackage[
    pdftitle={\cvauthor's CV},
    pdfauthor={\cvauthor},
    pdfcreator={LaTeX with RenderCV},
    colorlinks=true,
    urlcolor=primaryColor
]{hyperref} % for links, metadata and bookmarks
\RequirePackage[pscoord]{eso-pic} % for floating text on the page
\RequirePackage{calc} % for calculating lengths
\RequirePackage{bookmark} % for bookmarks
\RequirePackage{lastpage} % for getting the total number of pages
\RequirePackage{changepage} % for one column entries (adjustwidth environment)
\RequirePackage{paracol} % for two and three column entries
\RequirePackage{ifthen} % for conditional statements
\RequirePackage{needspace} % for avoiding page brake right after the section title
\RequirePackage{iftex} % check if engine is pdflatex, xetex or luatex
\RequirePackage{fancyhdr}
%\RequirePackage[default, type1]{sourcesanspro} 

% Some settings:
\AtBeginEnvironment{adjustwidth}{\partopsep0pt} % remove space before adjustwidth environment
\pagestyle{empty} % no header or footer
\setcounter{secnumdepth}{0} % no section numbering
\setlength{\parindent}{0pt} % no indentation
\setlength{\topskip}{0pt} % no top skip
\setlength{\columnsep}{0.15cm} % set column seperation
\makeatletter
\let\ps@customFooterStyle\ps@plain % Copy the plain style to customFooterStyle
\patchcmd{\ps@customFooterStyle}{\thepage}{
    \color{gray}\textit{\small CV of \cvauthor - Page \thepage{} of \pageref{LastPage}}
}{}{} % replace number by desired string
\makeatother
\pagestyle{customFooterStyle}

\titleformat{\section}{
    % avoid page braking right after the section title
    \needspace{4\baselineskip}
    % make the font size of the section title large and color it with the primary color
    \Large\color{primaryColor}
}{
}{
}{
    % print bold title, give 0.15 cm space and draw a line of 0.8 pt thickness
    % from the end of the title to the end of the body
    \textbf{#1}\hspace{0.15cm}\titlerule[0.8pt]\hspace{-0.1cm}
}[] % section title formatting

\titlespacing{\section}{
    % left space:
    -1pt
}{
    % top space:
    0.3 cm
}{
    % bottom space:
    0.2 cm
} % section title spacing

% \renewcommand\labelitemi{$\vcenter{\hbox{\small$\bullet$}}$} % custom bullet points
\newenvironment{highlights}{
    \begin{itemize}[
        topsep=0.10 cm,
        parsep=0.10 cm,
        partopsep=0pt,
        itemsep=0pt,
        leftmargin=0.4 cm + 10pt
    ]
}{
    \end{itemize}
} % new environment for highlights

\newenvironment{highlightsforbulletentries}{
    \begin{itemize}[
        topsep=0.10 cm,
        parsep=0.10 cm,
        partopsep=0pt,
        itemsep=0pt,
        leftmargin=10pt
    ]
}{
    \end{itemize}
} % new environment for highlights for bullet entries


\newenvironment{onecolentry}{
    \begin{adjustwidth}{
        0.2 cm + 0.00001 cm
    }{
        0.2 cm + 0.00001 cm
    }
}{
    \end{adjustwidth}
} % new environment for one column entries

\newenvironment{twocolentry}[2][]{
    \onecolentry
    \def\secondColumn{#2}
    \setcolumnwidth{\fill, 4.5 cm}
    \begin{paracol}{2}
}{
    \switchcolumn \raggedleft \secondColumn
    \end{paracol}
    \endonecolentry
} % new environment for two column entries

\newenvironment{threecolentry}[3][]{
    \onecolentry
    \def\thirdColumn{#3}
    \setcolumnwidth{2 cm, \fill, 4.5 cm}
    \begin{paracol}{3}
    {\raggedright #2} \switchcolumn
}{
    \switchcolumn \raggedleft \thirdColumn
    \end{paracol}
    \endonecolentry
} % new environment for three column entries

\newenvironment{header}{
    \setlength{\topsep}{0pt}\par\kern\topsep\centering\color{primaryColor}\linespread{1.5}
}{
    \par\kern\topsep
} % new environment for the header

\newcommand{\placelastupdatedtext}{% \placetextbox{<horizontal pos>}{<vertical pos>}{<stuff>}
  \AddToShipoutPictureFG*{% Add <stuff> to current page foreground
    \put(
        \LenToUnit{\paperwidth-2 cm-0.2 cm+0.05cm},
        \LenToUnit{\paperheight-1.0 cm}
    ){\vtop{{\null}\makebox[0pt][c]{
        \small\color{gray}\textit{Last updated in \today}\hspace{\widthof{Last updated in \today}}
    }}}%
  }%
}%

% save the original href command in a new command:
\let\hrefWithoutArrow\href

% new command for external links:
\renewcommand{\href}[2]{\hrefWithoutArrow{#1}{\ifthenelse{\equal{#2}{}}{ }{#2 }\raisebox{.15ex}{\footnotesize \faExternalLink*}}}


\newcommand{\AND}{\unskip
\cleaders\copy\ANDbox\hskip\wd\ANDbox
\ignorespaces
}


\newsavebox\ANDbox
\sbox\ANDbox{}

%\DeclareSourcemap{
%  \maps[datatype=bibtex]{
%    \map{
%      \step[fieldsource=citationnos]
%      \step[fieldset=usera, origfieldval]
%      \step[fieldset=citationnos, null] % optional: remove original
%    }
%  }
%}

\usepackage[
    backend=biber,
    style=ext-numeric,
    firstinits=false,
    maxcitenames=99,
    maxbibnames=99,
    sorting=ydnt,
    defernumbers=true,
    isbn=false,
    datamodel=ignore,        % allow unknown fields
]{biblatex}

\AtBeginDocument{%
  \DeclareFieldFormat{doi}{%
    \ifhyperref
      {\href{https://doi.org/#1}{\nolinkurl{#1}}}%  হাইপারলিংক  \nolinkurl{#1}
      {\nolinkurl{#1}}%                       হাইপারলিংক না থাকলে শুধু টেক্সট
  }%
}



\addbibresource{papers.bib}

\makeatletter
\defbibenvironment{counter}
  {\renewcommand{\blx@driver}[1]{}}
  {}
  {\csnumgdef{entrycount}{%
      \csuse{entrycount}+1}}

     

\makeatother

% Print the labelnumber as the total number of entries in the
% current refsection, minus the actual labelnumber, plus one
\DeclareFieldFormat{labelnumber}{\mkbibdesc{#1}}
\newrobustcmd*{\mkbibdesc}[1]{%
  \number\numexpr\csuse{entrycount}+1-#1\relax}




%% The following text is taken from arcpubs.cls
%% https://davidpowell.github.io/latex-publication-list.html

%\RequirePackage[normalem]{ulem} %for \uline

%\newcommand{\Author}[1]{\newcommand{\filterlastname}{#1}}


% underline authors which match the given last name
%\DeclareNameFormat{author}{%
%\ifthenelse{\equal{\namepartfamily}{\filterlastname}}%
%    {\textbf{\uline{\ifblank{\namepartgiveni}{}{\namepartgiveni\space}\namepartfamily}}}%
%    {\ifblank{\namepartgiveni}{}{\namepartgiveni\space}\namepartfamily}%
%\ifthenelse{\value{listcount}<\value{liststop}}%
%    {\addcomma\space}
%    {}}

% filter to only include items where one author has the give last name
%\DeclareBibliographyCategory{byname}

%\DeclareIndexNameFormat{byname}{% Test could be refined
%  \ifboolexpr{ test {\ifdefstring{\filterlastname}{#1}}}
%    {\addtocategory{byname}{\thefield{entrykey}}}
%    {}}

%%
%% End of file `buetcv.sty'.

\endinput

