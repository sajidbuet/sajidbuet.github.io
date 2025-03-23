---
Title: Excel Hacks 
Placing: 7
icon: users
description: List of tips, tricks and functions to use Excel
date: '2023-07-07'
Template: blog
---

### Intro
The more senior one gets, probably more useful Word and Excel becomes. It is helpful to quickly search Google to find a correct answer to a problem, but sometimes the first result points to a StackOverflow thread where someone simply says "Why don't you google it?". So, I am posting this blog article to make life easy for me (as well as whoever stumbles onto my website). It would be some helpful macros and functions that I find useful. Some of the functions should also work with Google Sheets without modification.

#### Bangladeshi Taka in Lakh and Crore in Excel
It is super annoying to see number formatted in Millions and Billions, where realistically, Lakh and Crore is more meaningful to Bangladeshi (and probably Indian) people. It is amazing that Microsoft does not have a default numbering format for us. Anyway, to get properly formatted lakh and excel formats, Go to the ribbon Home>Number>More Number Formats>Custom

Enter any of the following formats as suitable:

* Positive Number only with paisa (1,15,000.00): 
```
[>9999999]##\,##\,##\,##0.00;[>99999]##\,##\,##0.00;##,##0.00
```
* Positive Number only ignoring paisa (1,15,000): 
```
[>9999999]##\,##\,##\,##0;[>99999]##\,##\,##0;##,##0
```
