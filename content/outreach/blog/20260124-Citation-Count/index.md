---
Title: Getting Citation Count - From Publish or Perish to TamperMonkey
Placing: 7
icon: users
description: Get citation count from google scholar articles.
date: '2025-05-11'
---

### Background
When I was in grad school, my PI frequently requested me to update their CVs - be that for new grant application, or be that for the annual vita update. I learned a new thing from them - including google scholar citation count in each article in their publication list. The work was unnecessarily tedious, and I found the tool Publish or Perish (PoP) from Harzing to be quite liberating. When I made my new website, I wrote some scripts that would quickly use the command line tool of PoP, and query the citation count. Unfortunately, Google scholar is now becoming unusable without logging into the account or solving captcha, which PoP is not supporting. Therefore, a new tool is needed for my workflow. 

### What I want
Since PoP was directly in my workflow, I want to produce a Publish and Perish style CSV, that would be used by my other python scripts to update my publication bib file. It would have been prohibitively timeconsuming in the past. Thankfully, I was familiar with a Chrome / Edge extension called TamperMonkey that would quickly run a JS file on top of the loaded Google Scholar profile. And vibe coding with ChatGPT gave me a working plugin within 30 minutes.

### The plugin 
I hosted the plugin in https://github.com/sajidbuet/scholar-profile-exporter/tree/main. Once you install tampermonkey, you need to run Edge in developer mode. Then you can download the PopCites csv and update your CV. 

Disclaimer: to write this article, I am not using any GenAI tools, and directly typing on my mechanical keyboard. The words, grammatical mistakes etc are my own. I must confess, I heavily use GenAI myself, but feel like my own voice needs to be saved. Starting from this blog, I will explicitly mention if the article is written by AI or if it is my own work.

