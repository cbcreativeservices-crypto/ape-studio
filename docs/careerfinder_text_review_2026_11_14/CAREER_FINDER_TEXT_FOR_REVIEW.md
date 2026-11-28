# Career Finder: every piece of text, for review (2026-11-14)
Pulled straight from the app's code on branch ota-after-approval-39-23 (commit f2fa9b62). Parts: A = screen text (634 pieces), E = how people reach it (6), D = labels on career pages (204), T = job titles (1896). Text in {curly braces} is filled in by the app (a number, a name or a list); keep the braces when you suggest a change.

## Part E: how people reach the Career Finder
| ID | Where it shows | Text |
|---|---|---|
| CF-E0001 | Home card headline (src/screens/courses/CourseSelectionScreen.tsx:272) | Find Your Audio Career |
| CF-E0002 | Home card title (src/screens/courses/CourseSelectionScreen.tsx:439) | Audio Career Finder |
| CF-E0003 | Home card short name (src/screens/courses/CourseSelectionScreen.tsx:458) | Career Finder |
| CF-E0004 | First-run tour stop: label (src/features/intro/samplerStops.ts:88) | Where this leads |
| CF-E0005 | First-run tour stop: blurb (src/features/intro/samplerStops.ts:89) | The careers built on sound level and acoustics — find your fit. |
| CF-E0006 | First-run tour stop: recap (src/features/intro/samplerStops.ts:92) | From a single number to a whole career. Explore more, or make yourself at home? |

## Part A: screen text, grouped by screen
A short piece next to a longer one on the same line is usually a label or a screen-reader version of the same button. Pieces on lines next to each other may be shown joined into one sentence.

### Start screen (first page of the Career Finder)
File: `src/screens/careerfinder/CareerFinderScreen.tsx`
| ID | Line | Text |
|---|---|---|
| CF-A0001 | 28 | Which kinds of audio work would you enjoy doing? |
| CF-A0002 | 29 | Rate {QUESTION_COUNT} activities. In about five minutes you’ll have five career families worth exploring, and a place in the Academy to start on each. |
| CF-A0003 | 30 | Free. No account needed. Your answers stay on this phone. |
| CF-A0004 | 31 | You’ll answer for activities, not job titles. Answer for enjoyment only — whether you would be good at it, or could do it today, does not matter here. If you don’t know what an activity is like, say so: that is a useful answer, never a low score. |
| CF-A0005 | 35 | Free. You’re not signed in, so your answers are erased when you close the app. Sign in first to keep them. |
| CF-A0006 | 36 | This is a career-exploration tool. It does not measure your worth, guarantee success or determine what you are capable of learning. No percentages, no verdicts, no talent scores — possibilities to explore, with a place to start learning for each. |
| CF-A0007 | 40 | Clears your answers and results on this device. Saved families are kept. |
| CF-A0008 | 43 | Reset the Career Finder? {message} |
| CF-A0009 | 46 | Reset the Career Finder? |
| CF-A0010 | 46 | Reset |
| CF-A0011 | 83 | AUDIO CAREER FINDER · FREE · NO ACCOUNT |
| CF-A0012 | 83 | AUDIO CAREER FINDER |
| CF-A0013 | 83 | Audio Career Finder |
| CF-A0014 | 83 | Leave the Career Finder |
| CF-A0015 | 84 | {fmt(CAREER_COUNT)} job titles, {FAMILY_COUNT} career families, {QUESTION_COUNT} questions, about five minutes |
| CF-A0016 | 86 | TITLES |
| CF-A0017 | 87 | FAMILIES |
| CF-A0018 | 88 | QUESTIONS |
| CF-A0019 | 89 | MINUTES |
| CF-A0020 | 102 | Loading your answers… |
| CF-A0021 | 105 | VIEW MY RESULTS |
| CF-A0022 | 105 | Opens your five career families |
| CF-A0023 | 106 | CHANGE MY ANSWERS |
| CF-A0024 | 106 | Reopens the questions from the top with your answers kept |
| CF-A0025 | 110 | CONTINUE · QUESTION {Math.min(QUESTION_COUNT, resumeAt + 1)} OF {QUESTION_COUNT} |
| CF-A0026 | 110 | Continue at question {resumeAt + 1} of {QUESTION_COUNT} |
| CF-A0027 | 111 | of |
| CF-A0028 | 111 | answered · |
| CF-A0029 | 111 | kept until you close the app |
| CF-A0030 | 111 | saved on this phone |
| CF-A0031 | 111 | not saved on this phone |
| CF-A0032 | 111 | · all answered |
| CF-A0033 | 120 | START CAREER FINDER |
| CF-A0034 | 120 | Begins the {QUESTION_COUNT} questions. Progress is saved as you go. |
| CF-A0035 | 120 | Begins the {QUESTION_COUNT} questions. Your answers can’t be saved on this phone right now. |
| CF-A0036 | 121 | Your answers stay on this phone. |
| CF-A0037 | 121 | Your saved answers couldn’t be read on this phone, so new answers aren’t being saved. Reopen the Career Finder to retry. |
| CF-A0038 | 126 | HOW TO ANSWER |
| CF-A0039 | 128 | WHAT YOU GET |
| CF-A0040 | 129 | Your answers become a profile across fourteen kinds of audio work. That profile is compared with |
| CF-A0041 | 129 | career families, and the families that lean on what you enjoy come to the top — with the reason each one appeared, and the Academy topics that lead into it. |
| CF-A0042 | 137 | SAVED FAMILIES |
| CF-A0043 | 137 | STARRED FAMILIES — NOT SAVED ON THIS PHONE |
| CF-A0044 | 139 | Open {f.name} |
| CF-A0045 | 148 | RESET & START OVER |
| CF-A0046 | 148 | Reset and start over |
| CF-A0047 | 148 | Clears your answers and results on this device. Asks first. |
| CF-A0048 | 152 | Browse all {FAMILY_COUNT} career families |
| CF-A0049 | 153 | How this works, and what it does not measure |

### Question screen (the quiz)
File: `src/screens/careerfinder/CareerFinderQuizScreen.tsx`
| ID | Line | Text |
|---|---|---|
| CF-A0050 | 36 | How would you feel about |
| CF-A0051 | 37 | A quarter done |
| CF-A0052 | 37 | Halfway — 14 to go |
| CF-A0053 | 37 | Last seven |
| CF-A0054 | 101 | Question {idx + 1} of {QUESTION_COUNT} |
| CF-A0055 | 142 | AUDIO CAREER FINDER |
| CF-A0056 | 143 | Question {index + 1} of {QUESTION_COUNT} |
| CF-A0057 | 145 | Leave the questions. Your answers are kept until you close the app. |
| CF-A0058 | 145 | Leave the questions. Your answers are saved. |
| CF-A0059 | 145 | Leave the questions. Your answers could not be saved on this phone. |
| CF-A0060 | 149 | ‹ BACK |
| CF-A0061 | 149 | Back one question |
| CF-A0062 | 152 | SEE MY RESULTS › |
| CF-A0063 | 152 | See my results |
| CF-A0064 | 152 | See my results — answer every question first |
| CF-A0065 | 154 | CONTINUE › |
| CF-A0066 | 154 | Continue to the next question |
| CF-A0067 | 154 | Continue — choose an answer first |
| CF-A0068 | 159 | Question {index + 1} of {QUESTION_COUNT} |
| CF-A0069 | 167 | Your answer |
| CF-A0070 | 180 | Not scored. Marks this activity as new to you. |
| CF-A0071 | 191 | “I don’t know enough about this” is never counted as dislike. It simply marks an activity you have not met yet. |

### Results screen
File: `src/screens/careerfinder/CareerFinderResultsScreen.tsx`
| ID | Line | Text |
|---|---|---|
| CF-A0072 | 30 | Five audio career families lean on what you said you would enjoy. Start with the top one. |
| CF-A0073 | 31 | These are possibilities to explore — not limits on what you can pursue. Interests change with experience, and these will too. |
| CF-A0074 | 81 | Audio Career Finder |
| CF-A0075 | 82 | Career Finder results |
| CF-A0076 | 83 | (not answered) |
| CF-A0077 | 84 | (blank) |
| CF-A0078 | 125 | For example: {f.examples .map((e) => (isRegulatedTitle(e) ? `${e}, licensed or credentialed occupation` : furtherEducationForTitle(e) ? `${e}, further education required` : e)) .join(', ')} |
| CF-A0079 | 129 | FOR EXAMPLE |
| CF-A0080 | 140 | ⚠ Licensed or credentialed occupation. Academy study does not lead to that license or credential — check what is required where you live. |
| CF-A0081 | 150 | Academy study does not replace it — check what is required where you live. |
| CF-A0082 | 155 | Explore {f.name} |
| CF-A0083 | 156 | EXPLORE FAMILY › |
| CF-A0084 | 158 | Remove {f.name} from saved |
| CF-A0085 | 158 | Save {f.name} |
| CF-A0086 | 162 | ★ SAVED |
| CF-A0087 | 162 | ★ NOT SAVED |
| CF-A0088 | 162 | ☆ SAVE |
| CF-A0089 | 179 | Loading your results… |
| CF-A0090 | 181 | Your saved answers and results could not be read on this phone, so there is nothing to show yet. Go back and open the Career Finder again to retry. |
| CF-A0091 | 183 | No results yet — answer the questions first. |
| CF-A0092 | 187 | AUDIO CAREER FINDER · RESULTS |
| CF-A0093 | 187 | Your Audio Career Results |
| CF-A0094 | 187 | Back |
| CF-A0095 | 189 | START CAREER FINDER |
| CF-A0096 | 196 | AUDIO CAREER FINDER · RESULTS |
| CF-A0097 | 196 | Your Audio Career Results |
| CF-A0098 | 196 | Back |
| CF-A0099 | 197 | Nothing stood out strongly yet, so these are the families nearest to your answers — not matches. Exploring one will teach you more than the questions did. |
| CF-A0100 | 199 | CLOSEST TO YOUR ANSWERS |
| CF-A0101 | 199 | STRONGEST MATCHES |
| CF-A0102 | 204 | YOUR PROFILE |
| CF-A0103 | 205 | Profile clarity: {CLARITY_LABEL[result.clarity]} |
| CF-A0104 | 211 | Activities you said you would enjoy most |
| CF-A0105 | 215 | What these activities mean |
| CF-A0106 | 216 | WHAT THESE MEAN |
| CF-A0107 | 221 | Each activity is measured by only two questions, so one answer moves its bar a lot. Treat the bars as a sketch of what you said you would enjoy — not a measurement of ability. |
| CF-A0108 | 224 | of |
| CF-A0109 | 224 | answers were “I don’t know enough about this”. Those activities are unexplored, not disliked |
| CF-A0110 | 225 | — the dashed bars had no rating at all. |
| CF-A0111 | 232 | NEXT CLOSEST |
| CF-A0112 | 232 | OTHER PROMISING DIRECTIONS |
| CF-A0113 | 237 | ONE YOU MAY NOT HAVE CONSIDERED |
| CF-A0114 | 238 | Same strongest interest, a different corner of the audio world. Many of these families are unfamiliar even to people who work in audio — that is part of why the index exists. |
| CF-A0115 | 239 | Shares your strongest interest, {DIMENSIONS[lead.code].label}, in a field none of your top five touch. |
| CF-A0116 | 244 | WHAT TO DO NEXT |
| CF-A0117 | 245 | Open {result.top[0].family.name} |
| CF-A0118 | 246 | Open |
| CF-A0119 | 246 | and add its first topic to your study list. |
| CF-A0120 | 249 | Try the {lab.title} |
| CF-A0121 | 250 | Try a lab that uses |
| CF-A0122 | 254 | Open {unexplored.family.name} |
| CF-A0123 | 255 | Open one family you said you didn’t know enough about: |
| CF-A0124 | 258 | Read about {result.surprise.family.name} |
| CF-A0125 | 259 | Read |
| CF-A0126 | 259 | — same strongest interest, a different corner. |
| CF-A0127 | 262 | When you have tried one, come back and change any answer — the results recalculate. |
| CF-A0128 | 266 | BROWSE ALL {FAMILY_COUNT} FAMILIES |
| CF-A0129 | 267 | CHANGE OR START OVER |
| CF-A0130 | 268 | CHANGE MY ANSWERS |
| CF-A0131 | 268 | Reopens the questions from the top with your answers kept. |
| CF-A0132 | 269 | RESET & START OVER |
| CF-A0133 | 269 | Reset and start over |
| CF-A0134 | 269 | Clears your answers and results, then restarts from question one. Asks first. |
| CF-A0135 | 275 | FEEDBACK |
| CF-A0136 | 277 | Did these results give you at least one career direction you would explore? |
| CF-A0137 | 278 | Did these results give you a direction to explore |
| CF-A0138 | 279 | YES |
| CF-A0139 | 279 | SOMEWHAT |
| CF-A0140 | 290 | What did the Career Finder misunderstand? (optional) |
| CF-A0141 | 295 | Anything it got wrong, missed, or named badly. |
| CF-A0142 | 299 | What did the Career Finder misunderstand |
| CF-A0143 | 301 | This device could not save your feedback — it is on screen for now and will be gone when you close the app. You can still send it to the Academy with the button. |
| CF-A0144 | 301 | Saved on this device. To send it to the Academy, use the button — it opens your mail app with the answer filled in, and you decide whether to send. |
| CF-A0145 | 302 | SEND TO THE ACADEMY |
| CF-A0146 | 302 | Opens your mail app. Nothing is sent until you send it. |
| CF-A0147 | 308 | How this works, and what it does not measure |

### All career families list
File: `src/screens/careerfinder/CareerFamilyListScreen.tsx`
| ID | Line | Text |
|---|---|---|
| CF-A0148 | 31 | Other |
| CF-A0149 | 38 | AUDIO CAREER FINDER · {FAMILIES.length} FAMILIES |
| CF-A0150 | 38 | Most kinds of paid audio work |
| CF-A0151 | 39 | titles, grouped into |
| CF-A0152 | 39 | families, each listed under the Academy field that leads into it. |
| CF-A0153 | 39 | Your rank from the Career Finder is shown beside each one. |
| CF-A0154 | 47 | {f.name}, {meta?.count ?? 0} titles{rank ? `, ranked ${rank} for you` : ''} |

### One career family page (titles, preparation, related topics)
File: `src/screens/careerfinder/CareerFamilyScreen.tsx`
| ID | Line | Text |
|---|---|---|
| CF-A0155 | 89 | This topic stays |
| CF-A0156 | 91 | This is a required topic, so it stays in your list until you complete it. |
| CF-A0157 | 92 | This topic is always part of your list. |
| CF-A0158 | 107 | AUDIO CAREER FINDER |
| CF-A0159 | 107 | Career family |
| CF-A0160 | 108 | This family is not in the current index. Go back and choose another. |
| CF-A0161 | 121 | Main |
| CF-A0162 | 153 | Awards |
| CF-A0163 | 155 | Career family |
| CF-A0164 | 159 | CAREER FAMILY · {fam.count} TITLES |
| CF-A0165 | 162 | Back to results |
| CF-A0166 | 162 | Back to all families |
| CF-A0167 | 162 | Back |
| CF-A0168 | 165 | RANKED # |
| CF-A0169 | 165 | FOR YOU |
| CF-A0170 | 165 | IN YOUR TOP TEN |
| CF-A0171 | 169 | STARRED — NOT SAVED ON THIS PHONE |
| CF-A0172 | 174 | HOW IT LINES UP WITH YOUR ANSWERS |
| CF-A0173 | 180 | THE ACTIVITIES IT LEANS ON |
| CF-A0174 | 182 | Main activity first. Take the Career Finder to see how your own interests line up with them. |
| CF-A0175 | 188 | LICENSED OR CREDENTIALED PROFESSIONS IN THIS FAMILY |
| CF-A0176 | 189 | Some titles here are licensed, credentialed or restricted-entry occupations (marked LICENSED below). Academy topics build the audio and acoustics knowledge those fields draw on; they are not a route to any license, clinical credential, bar admission or security clearance, and completing them does not qualify anyone to practice. Check the licensing body where you live. |
| CF-A0177 | 194 | AUDIO KNOWLEDGE THAT SUPPORTS THIS FAMILY |
| CF-A0178 | 194 | START LEARNING IN THE ACADEMY |
| CF-A0179 | 210 | These Academy topics lead into this family. Tap one to add it to your study list. |
| CF-A0180 | 211 | These Academy topics lead into this family. Adding topics to your study list is for Academy members. |
| CF-A0181 | 212 | START HERE |
| CF-A0182 | 217 | Remove {name} from your study list |
| CF-A0183 | 217 | Add {name} to your study list |
| CF-A0184 | 224 | Show fewer |
| CF-A0185 | 224 | Show {fam.topicGs.length - START_HERE} more topic{fam.topicGs.length - START_HERE === 1 ? '' : 's'} |
| CF-A0186 | 227 | STUDY {addedHere.length} TOPIC{addedHere.length === 1 ? '' : 'S'} NOW › |
| CF-A0187 | 227 | Opens your Study Dashboard at the first topic you added |
| CF-A0188 | 229 | Open the full curriculum |
| CF-A0189 | 233 | The subject above is the place to begin; its topics are listed on the Explore page. |
| CF-A0190 | 234 | OPEN THE CURRICULUM |
| CF-A0191 | 234 | Opens the Explore page with every subject |
| CF-A0192 | 240 | REPRESENTATIVE CAREERS |
| CF-A0193 | 256 | ⚠ Licensed or credentialed occupation. Academy study supports it but does not lead to that license or credential — check what is required where you live. |
| CF-A0194 | 265 | Academy study does not replace it — check what is required where you live. |
| CF-A0195 | 269 | WHERE THE WORK HAPPENS |
| CF-A0196 | 271 | HOW CENTRAL AUDIO IS |
| CF-A0197 | 275 | Titles cross-checked against public listings from |
| CF-A0198 | 275 | . None of them reviewed or endorsed this index — see How this works. |
| CF-A0199 | 280 | COMMON ENTRY POINTS |
| CF-A0200 | 281 | Titles in this family that usually need the least formal preparation to get started. |
| CF-A0201 | 287 | BROWSE CAREERS IN THIS FAMILY |
| CF-A0202 | 288 | titles from the Grand Audio Career Index. Some are the same occupation under different names, seniority levels or employers — that is how the industry actually talks. |
| CF-A0203 | 291 | SHOW {Math.min(PAGE * 2, careers.length - shown)} MORE · {careers.length - shown} LEFT |
| CF-A0204 | 301 | BACK TO RESULTS |
| CF-A0205 | 303 | BACK TO ALL FAMILIES |
| CF-A0206 | 305 | SEE MY RESULTS |
| CF-A0207 | 307 | TAKE THE CAREER FINDER |
| CF-A0208 | 310 | Back to the Career Finder |
| CF-A0209 | 311 | Suggest a correction |
| CF-A0210 | 311 | Suggest a correction. Opens your mail app with this family named. |
| CF-A0211 | 328 | LICENSED |
| CF-A0212 | 335 | ALSO CALLED |
| CF-A0213 | 336 | KIND OF ROLE |
| CF-A0214 | 337 | HOW PEOPLE WORK |
| CF-A0215 | 338 | TYPICAL PREPARATION |
| CF-A0216 | 339 | AUDIO IN THIS ROLE |
| CF-A0217 | 340 | ⚠ Licensed, credentialed or restricted-entry occupation in many places. Academy study does not lead to that license or credential — verify requirements with the licensing body or employer where you live. |
| CF-A0218 | 341 | ⚠ In many places, offering engineering services to the public or stamping reports with an engineer’s seal requires a Professional Engineer license. |
| CF-A0219 | 342 | . Common pathways are described, not mandatory requirements. |

### How this works (About) screen
File: `src/screens/careerfinder/CareerFinderAboutScreen.tsx`
| ID | Line | Text |
|---|---|---|
| CF-A0220 | 26 | Audio Career Finder |
| CF-A0221 | 26 | How this works |
| CF-A0222 | 28 | AUDIO CAREER FINDER · HOW THIS WORKS |
| CF-A0223 | 28 | What it measures, and what it doesn’t |
| CF-A0224 | 29 | The Career Finder is a career-exploration tool. It helps you discover paid work involving audio and identify promising directions to investigate. It does not tell you what you should become. |
| CF-A0225 | 32 | WHAT COUNTS AS AN AUDIO CAREER |
| CF-A0226 | 33 | Any paid work that requires audio knowledge, audio-related skill or audio ability — employees, freelancers, contractors, consultants, business owners, performers, researchers, educators, clinicians, craftspeople and paid gig workers. A title does not need the word “audio” in it if sound-related knowledge is necessary to do the job. Unpaid hobby or volunteer activity is not included. |
| CF-A0227 | 34 | Because that definition is broad, every title also says how central audio is to it: |
| CF-A0228 | 34 | ) or |
| CF-A0229 | 38 | WHAT THE QUESTIONS MEASURE |
| CF-A0230 | 39 | questions ask how you would feel about doing specific activities. They measure |
| CF-A0231 | 39 | interest |
| CF-A0232 | 39 | — what you think you would enjoy — across fourteen kinds of audio work: |
| CF-A0233 | 48 | WHAT IT DOES NOT MEASURE |
| CF-A0234 | 49 | It does not measure ability, aptitude, knowledge, readiness, personality or fit with a workplace. It cannot tell whether you can hear distortion, troubleshoot signal flow, write code or run a session today. Interest is one useful piece of a career decision — research finds it relates to satisfaction, but modestly. Pay, colleagues, values, preparation and opportunity matter too. |
| CF-A0235 | 50 | “I don’t know enough about this” is treated as missing evidence, never as dislike. Not having tried something is not the same as being unsuited to it. |
| CF-A0236 | 51 | Each activity is measured by only two questions, so one answer can move its bar a lot. Treat the profile as a sketch, not a measurement. |
| CF-A0237 | 52 | Your answers are stored only on this device and are never sent anywhere unless you choose to email feedback. |
| CF-A0238 | 56 | HOW CAREERS ARE GROUPED AND MATCHED |
| CF-A0239 | 57 | job titles were cross-checked against publicly available occupational listings and role descriptions — including those published by the U.S. Bureau of Labor Statistics and O*NET, the Audio Engineering Society, the Acoustical Society of America, SMPTE, ASHA, IATSE and the Piano Technicians Guild — and grouped by the Academy into |
| CF-A0240 | 57 | career families. None of those organizations participated in, reviewed or endorsed this index, and no title here implies membership in or certification by any of them. Titles and licensing rules are described mainly as used in the United States; names and requirements differ elsewhere. |
| CF-A0241 | 58 | Many titles are the same occupation under different names, seniority levels or employers; the index keeps them because that is how the industry actually talks. |
| CF-A0242 | 59 | Each family names its three dominant activities. Your score on the main activity carries |
| CF-A0243 | 59 | % of the family’s score, the second |
| CF-A0244 | 59 | % and the third |
| CF-A0245 | 59 | %. Families are ranked from highest to lowest, and the reason each one appeared is generated from your actual answers by a fixed template — never by an AI. |
| CF-A0246 | 60 | Profile clarity is a plain description of your answers: |
| CF-A0247 | 60 | Clear |
| CF-A0248 | 60 | when at least one activity scored high and others sat clearly lower; |
| CF-A0249 | 60 | Broad |
| CF-A0250 | 60 | when most were rated alike; |
| CF-A0251 | 60 | Early |
| CF-A0252 | 60 | when more than |
| CF-A0253 | 60 | % of answers were “I don’t know”. |
| CF-A0254 | 64 | PROVISIONAL, AND LABELED SO |
| CF-A0255 | 65 | The links between families and activities, and the weights above, are an expert’s first estimate, not a tested measure. They haven’t been checked against real answers yet and will change as people use the Finder and professionals correct it. Nothing here should be used to screen anyone for a job. |
| CF-A0256 | 66 | Questionnaire |
| CF-A0257 | 66 | · Index |
| CF-A0258 | 70 | SEE SOMETHING WRONG? |
| CF-A0259 | 71 | If a title is misnamed, a family is missing a career you know, or a requirement is stated badly, tell us. Corrections from people who do the work are how this index improves. |
| CF-A0260 | 72 | SUGGEST A CORRECTION |
| CF-A0261 | 72 | Opens your mail app. You decide whether to send. |

### Shared pieces (buttons, chips, screen-reader labels)
File: `src/screens/careerfinder/kit.tsx`
| ID | Line | Text |
|---|---|---|
| CF-A0262 | 25 | Go back |
| CF-A0263 | 116 | Remove {name} from saved families |
| CF-A0264 | 116 | Save {name} |
| CF-A0265 | 156 | {label}{primary ? ', main activity' : ''}{strength ? `: ${strength === 'unknown' ? 'not enough evidence' : strength === 'neutral' ? 'neutral' : `${strength} interest`}` : ''} |
| CF-A0266 | 160 | · main |
| CF-A0267 | 170 | Rank {rank} |
| CF-A0268 | 184 | {c.label}{count != null ? `, ${count} titles` : ''}. {c.explain} |
| CF-A0269 | 210 | Your interest by activity. {summary}. Heights show what you said you would enjoy, not ability. |

### The questions and the answer buttons
File: `src/features/careerfinder/questions.ts`
| ID | Line | Text |
|---|---|---|
| CF-A0270 | 22 | How would you feel about creating original music or sound starting with a blank project? |
| CF-A0271 | 23 | How would you feel about designing an audio system for a venue, school, business or public space? |
| CF-A0272 | 24 | How would you feel about helping someone improve their hearing through testing, technology or rehabilitation? |
| CF-A0273 | 25 | How would you feel about carefully removing noise, clicks, mistakes or unwanted sounds from a recording? |
| CF-A0274 | 26 | How would you feel about managing an audio team, department, studio or production? |
| CF-A0275 | 27 | How would you feel about measuring noise, reverberation or vibration and interpreting the results? |
| CF-A0276 | 28 | How would you feel about selecting and positioning microphones to capture the best sound? |
| CF-A0277 | 29 | How would you feel about teaching beginners how sound, signal flow and audio equipment work? |
| CF-A0278 | 30 | How would you feel about mixing sound during a concert, broadcast or live event? |
| CF-A0279 | 31 | How would you feel about programming an audio plugin, application or digital instrument? |
| CF-A0280 | 32 | How would you feel about cataloging recordings and creating accurate descriptions and metadata (titles, dates, credits)? |
| CF-A0281 | 33 | How would you feel about opening malfunctioning audio equipment and finding the component that failed? |
| CF-A0282 | 34 | How would you feel about designing sound that strengthens the emotion and meaning of a film scene? |
| CF-A0283 | 35 | How would you feel about interpreting technical standards and checking whether audio systems comply with them? |
| CF-A0284 | 36 | How would you feel about running a recording session and managing takes, files and performers? |
| CF-A0285 | 37 | How would you feel about performing music, voice or sound for an audience or recording? |
| CF-A0286 | 38 | How would you feel about designing experiments to understand how sound behaves or how people perceive it? |
| CF-A0287 | 39 | How would you feel about suggesting and selling audio products based on a customer’s needs? |
| CF-A0288 | 40 | How would you feel about creating sounds that change in response to a player’s actions in a game or virtual environment? |
| CF-A0289 | 41 | How would you feel about soldering and assembling electronic circuits or audio devices? |
| CF-A0290 | 42 | How would you feel about coaching musicians, singers or students as they develop their abilities? |
| CF-A0291 | 43 | How would you feel about examining a recording to determine whether it was altered or is authentic? |
| CF-A0292 | 44 | How would you feel about creating algorithms that modify, analyze or generate sound in real time? |
| CF-A0293 | 45 | How would you feel about diagnosing and fixing an audio failure while an event is still happening? |
| CF-A0294 | 46 | How would you feel about balancing many tracks until the sound feels clear, powerful and emotionally right? |
| CF-A0295 | 47 | How would you feel about selecting music or sounds for a collection, program, production or audience? |
| CF-A0296 | 48 | How would you feel about configuring computers and network equipment to carry audio between many locations? |
| CF-A0297 | 49 | How would you feel about helping someone improve their speech, voice or communication? |
| CF-A0298 | 57 | Strongly dislike |
| CF-A0299 | 57 | Strongly dislike |
| CF-A0300 | 58 | Dislike |
| CF-A0301 | 58 | Dislike |
| CF-A0302 | 59 | Neutral |
| CF-A0303 | 59 | Neutral |
| CF-A0304 | 60 | Like |
| CF-A0305 | 60 | Like |
| CF-A0306 | 61 | Strongly like |
| CF-A0307 | 61 | Strongly like |
| CF-A0308 | 62 | I don’t know enough about this |
| CF-A0309 | 62 | Not sure |

### The activity areas (names and explanations)
File: `src/features/careerfinder/dimensions.ts`
| ID | Line | Text |
|---|---|---|
| CF-A0310 | 22 | Create & Perform |
| CF-A0311 | 22 | Composing, performing, improvising and artistic expression. |
| CF-A0312 | 22 | creating and performing |
| CF-A0313 | 23 | Record & Capture |
| CF-A0314 | 23 | Microphones, sessions, location sound and capturing a source well. |
| CF-A0315 | 23 | recording and capturing sound |
| CF-A0316 | 24 | Edit & Refine |
| CF-A0317 | 24 | Editing, mixing, mastering, restoration and detailed improvement. |
| CF-A0318 | 24 | editing and refining |
| CF-A0319 | 25 | Media & Storytelling |
| CF-A0320 | 25 | Sound that serves stories, pictures, games, speech and experiences. |
| CF-A0321 | 25 | sound for media and storytelling |
| CF-A0322 | 26 | Live Operation |
| CF-A0323 | 26 | Running shows, reacting quickly and working under real-time pressure. |
| CF-A0324 | 26 | live operation |
| CF-A0325 | 27 | Systems & Deployment |
| CF-A0326 | 27 | Designing, connecting, installing, networking and tuning systems. |
| CF-A0327 | 27 | systems and deployment |
| CF-A0328 | 28 | Build & Maintain |
| CF-A0329 | 28 | Manufacturing, soldering, repair, construction and physical equipment. |
| CF-A0330 | 28 | building and maintaining equipment |
| CF-A0331 | 29 | Digital, Software & AI |
| CF-A0332 | 29 | Programming, DSP (digital signal processing), automation, software and machine learning. |
| CF-A0333 | 29 | software and digital audio |
| CF-A0334 | 30 | Analyze & Research |
| CF-A0335 | 30 | Measurement, experimentation, acoustical analysis and investigation. |
| CF-A0336 | 30 | analysis and research |
| CF-A0337 | 31 | Help, Clinical & Access |
| CF-A0338 | 31 | Improving hearing, communication, health and accessibility. |
| CF-A0339 | 31 | helping people hear and communicate |
| CF-A0340 | 32 | Teach & Explain |
| CF-A0341 | 32 | Instruction, coaching, documentation and technical communication. |
| CF-A0342 | 32 | teaching and explaining |
| CF-A0343 | 33 | Business & Leadership |
| CF-A0344 | 33 | Selling, managing, entrepreneurship, products and operations. |
| CF-A0345 | 33 | business and leadership |
| CF-A0346 | 34 | Preserve & Curate |
| CF-A0347 | 34 | Archiving, collecting, restoring, documenting and selecting material. |
| CF-A0348 | 34 | preserving and curating |
| CF-A0349 | 35 | Govern, Protect & Verify |
| CF-A0350 | 35 | Standards, compliance, rights, forensics, safety and intelligence. |
| CF-A0351 | 35 | standards, verification and protection |

### The 42 career families (names, example titles, one-sentence descriptions)
File: `src/features/careerfinder/families.ts`
| ID | Line | Text |
|---|---|---|
| CF-A0352 | 33 | Recording Studios & Music Production |
| CF-A0353 | 33 | Recording Engineer |
| CF-A0354 | 33 | Studio Engineer |
| CF-A0355 | 33 | Music Producer |
| CF-A0356 | 34 | Capturing performances in studios and on location, then shaping the recordings into finished music. |
| CF-A0357 | 35 | Mixing & Mastering |
| CF-A0358 | 35 | Mix Engineer |
| CF-A0359 | 35 | Mastering Engineer |
| CF-A0360 | 35 | Assistant Mix Engineer |
| CF-A0361 | 36 | Balancing recorded tracks into a mix, then preparing finished mixes so they sound consistent on different playback systems. |
| CF-A0362 | 37 | Music Creation, DAWs, Synthesis & Sonic Art |
| CF-A0363 | 37 | Composer |
| CF-A0364 | 37 | Electronic Music Producer |
| CF-A0365 | 37 | Sound Artist |
| CF-A0366 | 38 | Composing and producing original music and sound with software, synthesizers, samplers and creative tools. |
| CF-A0367 | 39 | Live Sound, Touring & Festivals |
| CF-A0368 | 39 | Front-of-House Engineer |
| CF-A0369 | 39 | Monitor Engineer |
| CF-A0370 | 39 | Live Systems Engineer |
| CF-A0371 | 40 | Deploying, operating and troubleshooting sound systems for concerts, tours, festivals and events as they happen. |
| CF-A0372 | 41 | Theater, Worship, Venues & Show Control |
| CF-A0373 | 41 | Theatrical Sound Designer |
| CF-A0374 | 41 | Theater A1 |
| CF-A0375 | 41 | Worship Audio Director |
| CF-A0376 | 42 | Designing and running sound for staged productions, services and permanent venues, cue by cue. |
| CF-A0377 | 43 | Film, Television & Post-Production Audio |
| CF-A0378 | 43 | Supervising Sound Editor |
| CF-A0379 | 43 | Dialogue Editor |
| CF-A0380 | 43 | Foley Recordist |
| CF-A0381 | 44 | Recording, editing, designing and mixing every sound that accompanies moving pictures. |
| CF-A0382 | 45 | Game, Interactive, XR & Immersive Audio |
| CF-A0383 | 45 | Game Audio Designer |
| CF-A0384 | 45 | Technical Sound Designer |
| CF-A0385 | 45 | XR Audio Engineer |
| CF-A0386 | 46 | Creating sound that responds to a player or a space, in games, virtual worlds and immersive formats. |
| CF-A0387 | 47 | Broadcast, Radio, Sports & Streaming |
| CF-A0388 | 47 | Broadcast Audio Engineer |
| CF-A0389 | 47 | Broadcast A1 |
| CF-A0390 | 47 | Radio Broadcast Engineer |
| CF-A0391 | 48 | Mixing and delivering live and produced audio for radio, television, sports and streaming audiences. |
| CF-A0392 | 49 | Podcast, Audiobook, Voice & Spoken-Word Production |
| CF-A0393 | 49 | Podcast Producer |
| CF-A0394 | 49 | Audiobook Engineer |
| CF-A0395 | 49 | Voiceover Recording Engineer |
| CF-A0396 | 50 | Recording, editing and producing the spoken voice for podcasts, audiobooks, narration and voiceover. |
| CF-A0397 | 51 | Installed AV, Integration & Institutional Systems |
| CF-A0398 | 51 | AV Systems Designer |
| CF-A0399 | 51 | AV Installation Technician |
| CF-A0400 | 51 | Commissioning Technician |
| CF-A0401 | 52 | Designing, installing and commissioning (testing and handing over) permanent audio and AV systems in buildings people use every day. |
| CF-A0402 | 53 | Architectural Acoustics, Noise & Vibration |
| CF-A0403 | 53 | Acoustical Consultant |
| CF-A0404 | 53 | Noise-Control Engineer |
| CF-A0405 | 53 | Vibration Consultant |
| CF-A0406 | 54 | Measuring, predicting and controlling how sound and vibration behave in rooms, buildings and the environment. |
| CF-A0407 | 55 | Scientific, Environmental & Applied Acoustics |
| CF-A0408 | 55 | Acoustics Research Scientist |
| CF-A0409 | 55 | Bioacoustician |
| CF-A0410 | 55 | Acoustic Oceanographer |
| CF-A0411 | 56 | Studying sound as a physical phenomenon, from animal calls and ocean noise to seismic and atmospheric acoustics. |
| CF-A0412 | 57 | Hearing, Audiology, Psychoacoustics & Accessibility |
| CF-A0413 | 57 | Audiologist |
| CF-A0414 | 57 | Hearing Instrument Specialist |
| CF-A0415 | 57 | Psychoacoustician |
| CF-A0416 | 58 | Assessing and managing hearing and balance, protecting hearing, fitting hearing technology, and studying how people perceive sound. |
| CF-A0417 | 59 | Medical Ultrasound & Therapeutic Acoustics |
| CF-A0418 | 59 | Diagnostic Medical Sonographer |
| CF-A0419 | 59 | Ultrasound Transducer Engineer |
| CF-A0420 | 59 | Ultrasound Imaging Scientist |
| CF-A0421 | 60 | Imaging the body with ultrasound, and engineering and researching the ultrasound systems used for diagnosis and therapy. |
| CF-A0422 | 61 | Audio Hardware, Transducers & Electronics Engineering |
| CF-A0423 | 61 | Audio Electronics Engineer |
| CF-A0424 | 61 | Loudspeaker Engineer |
| CF-A0425 | 61 | Microphone Design Engineer |
| CF-A0426 | 62 | Engineering the circuits, microphones, loudspeakers and devices that turn sound into signals and back again. |
| CF-A0427 | 63 | Audio Software, DSP, AI & Machine Learning |
| CF-A0428 | 63 | Audio DSP Engineer |
| CF-A0429 | 63 | Audio Machine-Learning Engineer |
| CF-A0430 | 63 | Audio Plugin Developer |
| CF-A0431 | 64 | Writing the software, signal processing and learning systems that analyze, transform and generate audio. |
| CF-A0432 | 65 | Manufacturing, Quality, Calibration & Repair |
| CF-A0433 | 65 | Audio Repair Technician |
| CF-A0434 | 65 | Calibration Technician |
| CF-A0435 | 65 | Audio QA Test Engineer |
| CF-A0436 | 66 | Building, testing, calibrating and repairing audio equipment so it performs to specification. |
| CF-A0437 | 67 | Audio Archiving, Preservation & Restoration |
| CF-A0438 | 67 | Audio Archivist |
| CF-A0439 | 67 | Preservation Engineer |
| CF-A0440 | 67 | Audio Restoration Engineer |
| CF-A0441 | 68 | Transferring recordings from aging carriers (tapes, discs and other media), restoring their sound and keeping them accessible for the future. |
| CF-A0442 | 69 | Forensic, Surveillance, Security & Public-Safety Audio |
| CF-A0443 | 69 | Forensic Audio Examiner |
| CF-A0444 | 69 | Surveillance Audio Analyst |
| CF-A0445 | 69 | Public-Safety Audio Technician |
| CF-A0446 | 70 | Examining, enhancing and authenticating recordings for investigations, courts and public safety. |
| CF-A0447 | 71 | Technical Standards, Regulation, Law & Rights |
| CF-A0448 | 71 | Audio Standards Engineer |
| CF-A0449 | 71 | Music Licensing Specialist |
| CF-A0450 | 71 | Broadcast Loudness Compliance Specialist |
| CF-A0451 | 72 | Writing and applying the standards, rules, licenses and rights that govern how audio is made, shared and measured. |
| CF-A0452 | 73 | Education, Research, Training & Technical Communication |
| CF-A0453 | 73 | Audio Instructor |
| CF-A0454 | 73 | Audio Curriculum Designer |
| CF-A0455 | 73 | Audio Technical Writer |
| CF-A0456 | 74 | Teaching audio, designing courses, and explaining technical ideas clearly in classrooms, manuals and media. |
| CF-A0457 | 75 | Audio Business, Product, Sales & Operations |
| CF-A0458 | 75 | Audio Product Manager |
| CF-A0459 | 75 | Pro Audio Sales Engineer |
| CF-A0460 | 75 | Studio Manager |
| CF-A0461 | 76 | Selling, planning, managing and running the studios, companies, products and teams that professional audio depends on. |
| CF-A0462 | 77 | Consumer, Home, Vehicle & Personal Audio |
| CF-A0463 | 77 | Automotive Audio Installer |
| CF-A0464 | 77 | Home Theater Designer |
| CF-A0465 | 77 | Consumer Audio Product Specialist |
| CF-A0466 | 78 | Designing, installing and supporting the audio people live with, in homes, vehicles and personal devices. |
| CF-A0467 | 79 | DJ, Club & Event Performance Technology |
| CF-A0468 | 79 | Club DJ |
| CF-A0469 | 79 | Mobile DJ |
| CF-A0470 | 79 | DJ Equipment Technician |
| CF-A0471 | 80 | Performing with recorded music and the technology that drives clubs, events and dance floors. |
| CF-A0472 | 81 | Sonic Branding, UX, Exhibits & Experience Design |
| CF-A0473 | 81 | Sonic Branding Designer |
| CF-A0474 | 81 | UX Sound Designer |
| CF-A0475 | 81 | Exhibit Audio Designer |
| CF-A0476 | 82 | Designing the sound of brands, products, interfaces, exhibits and public experiences. |
| CF-A0477 | 83 | Music for Picture, Scoring & Editorial |
| CF-A0478 | 83 | Film Composer |
| CF-A0479 | 83 | Music Editor |
| CF-A0480 | 83 | Orchestrator |
| CF-A0481 | 84 | Composing, arranging and editing music that serves film, television, trailers and advertising. |
| CF-A0482 | 85 | Audio Networks, Cloud & Technical Infrastructure |
| CF-A0483 | 85 | Audio Network Engineer |
| CF-A0484 | 85 | Broadcast Infrastructure Engineer |
| CF-A0485 | 85 | Cloud Audio Engineer |
| CF-A0486 | 86 | Building and running the networks, timing and cloud systems that move audio reliably between many places. |
| CF-A0487 | 87 | Audio Measurement, System Tuning & Instrumentation |
| CF-A0488 | 87 | Sound-System Alignment Engineer |
| CF-A0489 | 87 | Electroacoustic Measurement Engineer |
| CF-A0490 | 87 | Audio Measurement Technician |
| CF-A0491 | 88 | Measuring sound systems and spaces with instruments, then tuning them until they perform as intended. |
| CF-A0492 | 89 | Stagecraft, Rigging, Power & Production Support |
| CF-A0493 | 89 | Entertainment Rigger |
| CF-A0494 | 89 | Audio Stagehand |
| CF-A0495 | 89 | Power Distribution Technician — Events |
| CF-A0496 | 90 | Rigging, powering and supporting the physical production that live audio depends on, safely and on schedule. |
| CF-A0497 | 91 | Session Performance, Voice & Musical Direction |
| CF-A0498 | 91 | Session Musician |
| CF-A0499 | 91 | Vocal Producer |
| CF-A0500 | 91 | Music Director |
| CF-A0501 | 92 | Performing and directing music and voice in recording sessions, from the first take to the final one. |
| CF-A0502 | 93 | Music Performance, Conducting & Live Musical Direction |
| CF-A0503 | 93 | Performing Musician |
| CF-A0504 | 93 | Orchestra Conductor |
| CF-A0505 | 93 | Bandleader |
| CF-A0506 | 94 | Performing, conducting and leading music in front of audiences, in halls, clubs, worship and touring. |
| CF-A0507 | 95 | Musical Instrument Building, Tuning & Repair |
| CF-A0508 | 95 | Luthier |
| CF-A0509 | 95 | Piano Technician |
| CF-A0510 | 95 | Organ Builder |
| CF-A0511 | 96 | Building, tuning, restoring and repairing the instruments musicians play. |
| CF-A0512 | 97 | Music Education, Lessons & Musicianship Coaching |
| CF-A0513 | 97 | Music Teacher |
| CF-A0514 | 97 | Vocal Coach |
| CF-A0515 | 97 | Ear-Training Instructor |
| CF-A0516 | 98 | Teaching music, voice and listening, and coaching players as their abilities grow. |
| CF-A0517 | 99 | Music Therapy, Speech & Clinical Voice |
| CF-A0518 | 99 | Music Therapist |
| CF-A0519 | 99 | Speech-Language Pathologist |
| CF-A0520 | 99 | Clinical Voice Specialist |
| CF-A0521 | 100 | Clinical work with music, speech and voice — music therapy, speech-language pathology and voice rehabilitation — for people with communication, developmental or health needs. |
| CF-A0522 | 101 | Phonetics, Linguistics & Speech Science |
| CF-A0523 | 101 | Phonetician |
| CF-A0524 | 101 | Speech Scientist |
| CF-A0525 | 101 | Linguistics Laboratory Technician |
| CF-A0526 | 102 | Analyzing, recording and modeling the sounds of human speech and language. |
| CF-A0527 | 103 | Telecom, Voice Quality & Communications Audio |
| CF-A0528 | 103 | Voice-Quality Engineer |
| CF-A0529 | 103 | Telecommunications Audio Engineer |
| CF-A0530 | 103 | Speech Codec Engineer |
| CF-A0531 | 104 | Making transmitted voice clear and intelligible across phones, conferencing, radios and networks. |
| CF-A0532 | 105 | Acoustic Construction & Noise-Control Trades |
| CF-A0533 | 105 | Acoustic Installer |
| CF-A0534 | 105 | Soundproofing Contractor |
| CF-A0535 | 105 | Noise-Control Technician |
| CF-A0536 | 106 | Building and installing the treatments, partitions and enclosures that control sound in real spaces. |
| CF-A0537 | 107 | Music Curation, Repertoire, Libraries & Editorial |
| CF-A0538 | 107 | Music Supervisor |
| CF-A0539 | 107 | Music Librarian |
| CF-A0540 | 107 | Playlist Curator |
| CF-A0541 | 108 | Selecting, organizing and licensing music for productions, platforms, collections and audiences. |
| CF-A0542 | 109 | Defense, Sonar & Acoustic Intelligence |
| CF-A0543 | 109 | Sonar Technician |
| CF-A0544 | 109 | Acoustic Intelligence Analyst |
| CF-A0545 | 109 | Underwater Acoustics Engineer |
| CF-A0546 | 110 | Detecting, tracking and interpreting sound underwater and in the field for defense and security, often in military or government service. |
| CF-A0547 | 111 | Accessible Media & Audio Description |
| CF-A0548 | 111 | Audio Description Writer |
| CF-A0549 | 111 | Audio Description Narrator |
| CF-A0550 | 111 | Accessibility Audio Producer |
| CF-A0551 | 112 | Writing, voicing and producing audio that makes film, television, theater and museums accessible to blind and low-vision audiences and others who need it. |
| CF-A0552 | 113 | Music Retail, Rental & Instrument Services |
| CF-A0553 | 113 | Pro Audio Retail Specialist |
| CF-A0554 | 113 | Instrument Rental Technician |
| CF-A0555 | 113 | Backline Technician |
| CF-A0556 | 114 | Advising, supplying, renting and servicing the instruments and equipment musicians and productions rely on. |
| CF-A0557 | 115 | Field Recording, Sound Libraries & Sonic Heritage |
| CF-A0558 | 115 | Wildlife Sound Recordist |
| CF-A0559 | 115 | Sound Library Producer |
| CF-A0560 | 115 | Sonic Heritage Specialist |
| CF-A0561 | 116 | Recording the sounds of places, nature and cultures, and building the libraries that preserve them. |

### Results wording built from the answers (profile labels, "why this appeared")
File: `src/features/careerfinder/scoring.ts`
| ID | Line | Text |
|---|---|---|
| CF-A0562 | 79 | Clear Profile |
| CF-A0563 | 79 | Broad Profile |
| CF-A0564 | 79 | Early Profile |
| CF-A0565 | 118 | Many activities were new to you, so the picture is incomplete rather than wrong. Seeing more of the work will teach you more than more questions would — open one family you said you didn’t know enough about, then answer again. |
| CF-A0566 | 120 | One activity |
| CF-A0567 | 120 | Two activities |
| CF-A0568 | 120 | Three activities |
| CF-A0569 | 120 | Several activities |
| CF-A0570 | 121 | {n} stood out clearly and the rest sat lower, so these directions rest on real preferences. Open your top two and compare what each one leans on. |
| CF-A0571 | 124 | You rated most activities on the dislike side. That usually means the activities you would enjoy are not in this set yet, or that you answered on whether you would be good at them rather than whether you would enjoy them. Browse the families, then answer again for enjoyment only. |
| CF-A0572 | 126 | You rated many activities similarly. That is common, and it means more than one direction could suit you — trying things is the fastest way to tell them apart. |
| CF-A0573 | 183 | strong interest in {list(strong)} activities |
| CF-A0574 | 184 | some interest in {list(some)} |
| CF-A0575 | 185 | you were neutral about {list(neutral)} |
| CF-A0576 | 186 | , and |
| CF-A0577 | 190 | Its main activity is {primaryLabel}, which you rated lower. |
| CF-A0578 | 191 | It still appeared because you showed {because}. |
| CF-A0579 | 191 | It still appeared because it ranked highest against your answers overall. |
| CF-A0580 | 193 | Leans on {list(strong)} — {strong.length === 1 ? 'your strongest interest' : 'your strongest interests'}. |
| CF-A0581 | 194 | You also showed some interest in {list(some)}. |
| CF-A0582 | 195 | You were neutral about {list(neutral)}. |
| CF-A0583 | 197 | This appeared because you showed {because}. |
| CF-A0584 | 197 | This appeared because it ranked highest against your answers overall. |
| CF-A0585 | 200 | It also draws on {list(lowOthers)}, which you rated lower — as you compare families, notice how big a part of each one that is. |
| CF-A0586 | 201 | {list(lowOthers)} {lowOthers.length === 1 ? 'is' : 'are'} part of this work too, rated lower as well. |
| CF-A0587 | 202 | You said you did not know enough about {list(none)} yet, so that part is unexplored rather than ruled out. |

### Career index labels
File: `src/features/careerfinder/careerIndex.ts`
| ID | Line | Text |
|---|---|---|
| CF-A0588 | 28 | Audio-core |
| CF-A0589 | 28 | Audio or acoustics is the job itself. |
| CF-A0590 | 29 | Audio-specialized |
| CF-A0591 | 29 | An established profession with a recognized audio or acoustics specialty. |
| CF-A0592 | 30 | Audio-enabled |
| CF-A0593 | 30 | A role in which audio knowledge is one required, paid skill among others. |

### Education chips on job titles
File: `src/features/careerfinder/educationNote.ts`
| ID | Line | Text |
|---|---|---|
| CF-A0594 | 24 | A Professional Engineer license is commonly required to offer engineering services to the public or to stamp (seal) official reports. |
| CF-A0595 | 31 | Typical preparation: {c.preparation.replace(/\/ /g, '/')}. |
| CF-A0596 | 45 | PE LICENSE |
| CF-A0597 | 46 | DEGREE REQ. |

### "Try a lab" suggestions on the results
File: `src/features/careerfinder/labsForDimension.ts`
| ID | Line | Text |
|---|---|---|
| CF-A0598 | 17 | Oscillator Lab |
| CF-A0599 | 17 | shape a sound from nothing |
| CF-A0600 | 18 | Microphone Selection Lab |
| CF-A0601 | 18 | choose and place the right mic |
| CF-A0602 | 19 | EQ Lab |
| CF-A0603 | 19 | hear what a mix decision does |
| CF-A0604 | 20 | Sound Envelope & Transients Lab |
| CF-A0605 | 20 | how a sound tells a story in time |
| CF-A0606 | 21 | Signal Chain Lab |
| CF-A0607 | 21 | find the fault while the show runs |
| CF-A0608 | 22 | Cable Dressing & Installation Lab |
| CF-A0609 | 22 | make install decisions a pro would |
| CF-A0610 | 23 | Cable & Connector Fundamentals |
| CF-A0611 | 23 | get hands-on with the hardware |
| CF-A0612 | 24 | Digital Audio Lab |
| CF-A0613 | 24 | see sampling and bits do their work |
| CF-A0614 | 25 | Visual Audio Analysis Lab |
| CF-A0615 | 25 | read a measurement like an analyst |
| CF-A0616 | 26 | Ear Training Lab |
| CF-A0617 | 26 | train the listening that hearing work depends on |
| CF-A0618 | 27 | Foundations of Sound |
| CF-A0619 | 27 | the course you would teach from |
| CF-A0620 | 28 | Audio Calculators Lab |
| CF-A0621 | 28 | the numbers behind a quote or a spec |
| CF-A0622 | 29 | Vacuum Tube Reference |
| CF-A0623 | 29 | a curated collection, organized the way an archive is |
| CF-A0624 | 30 | Gain Staging Lab |
| CF-A0625 | 30 | keep a signal inside the rules at every stage |

### Required-education labels (degree, license, certification)
File: `src/data/careerRequirement.ts`
| ID | Line | Text |
|---|---|---|
| CF-A0626 | 44 | College degree required |
| CF-A0627 | 45 | Engineering degree required |
| CF-A0628 | 46 | State license required |
| CF-A0629 | 47 | Doctorate + license required |
| CF-A0630 | 48 | Certification required |
| CF-A0631 | 49 | Nondestructive-testing (NDT) certification required |
| CF-A0632 | 50 | Degree + professional registration required |
| CF-A0633 | 51 | Degree + Professional Engineer (PE) license may be required |
| CF-A0634 | 52 | Security clearance required |

## Part D: labels shown on career pages
On each job title the app shows KIND OF ROLE (titleClass · orientation), HOW PEOPLE WORK (workModel), TYPICAL PREPARATION (preparation) and a status line ("{status}. Common pathways are described, not mandatory requirements."). Each family page shows a path line and a "where people work" line. Source: src/data/careerIndex.json and src/data/careerFamilies.json (both built by scripts/build-career-index.py from scripts/career-index-overrides.json).

### Career detail labels: tier
| ID | Reference | Text |
|---|---|---|
| CF-D0001 | enums.tier[0] | Direct audio occupation |
| CF-D0002 | enums.tier[1] | Audio-dependent allied profession |
| CF-D0003 | enums.tier[2] | Context-specific paid role |

### Career detail labels: relationship
| ID | Reference | Text |
|---|---|---|
| CF-D0004 | enums.relationship[0] | Core audio/acoustics |
| CF-D0005 | enums.relationship[1] | Closely related / supporting |
| CF-D0006 | enums.relationship[2] | Audio-dependent allied work |
| CF-D0007 | enums.relationship[3] | Acoustics-based profession |
| CF-D0008 | enums.relationship[4] | Adjacent but audio-specific |

### Career detail labels: orientation
| ID | Reference | Text |
|---|---|---|
| CF-D0009 | enums.orientation[0] | Technical / engineering |
| CF-D0010 | enums.orientation[1] | Hands-on technical / trade |
| CF-D0011 | enums.orientation[2] | Business / editorial / operations |
| CF-D0012 | enums.orientation[3] | Creative / performance |
| CF-D0013 | enums.orientation[4] | Science / research |
| CF-D0014 | enums.orientation[5] | Education / coaching |
| CF-D0015 | enums.orientation[6] | Clinical / therapeutic |
| CF-D0016 | enums.orientation[7] | Legal / policy / standards |

### Career detail labels: titleClass
| ID | Reference | Text |
|---|---|---|
| CF-D0017 | enums.titleClass[0] | Established industry role |
| CF-D0018 | enums.titleClass[1] | Technical/creative specialty |
| CF-D0019 | enums.titleClass[2] | Operational/creative role |
| CF-D0020 | enums.titleClass[3] | Leadership/management |
| CF-D0021 | enums.titleClass[4] | Research specialty |
| CF-D0022 | enums.titleClass[5] | Education/communication |
| CF-D0023 | enums.titleClass[6] | Business/legal/adjacent role |
| CF-D0024 | enums.titleClass[7] | Consulting/freelance service |
| CF-D0025 | enums.titleClass[8] | Skilled trade/craft |
| CF-D0026 | enums.titleClass[9] | Regulated or credentialed profession |
| CF-D0027 | enums.titleClass[10] | Entry/support role |

### Career detail labels: status
| ID | Reference | Text |
|---|---|---|
| CF-D0028 | enums.status[0] | Established occupation or industry role |
| CF-D0029 | enums.status[1] | Established specialty or employer title |
| CF-D0030 | enums.status[2] | Emerging or fast-evolving title |
| CF-D0031 | enums.status[3] | Regulated/credentialed title |

### Career detail labels: workModel
| ID | Reference | Text |
|---|---|---|
| CF-D0032 | enums.workModel[0] | Staff roles common; consulting/contract options vary |
| CF-D0033 | enums.workModel[1] | Staff, freelance, or project-based depending on sector |
| CF-D0034 | enums.workModel[2] | Often freelance/contract; staff roles also exist |
| CF-D0035 | enums.workModel[3] | Project, venue, tour, or contract work common |
| CF-D0036 | enums.workModel[4] | Staff roles at a government patent office |
| CF-D0037 | enums.workModel[5] | Full-time uniformed military service |
| CF-D0038 | enums.workModel[6] | Self-employed business owner |
| CF-D0039 | enums.workModel[7] | Fixed-term research appointments, usually at universities or labs |
| CF-D0040 | enums.workModel[8] | Self-employed; local permits often required |

### Career detail labels: preparation
| ID | Reference | Text |
|---|---|---|
| CF-D0041 | enums.preparation[0] | Accredited clinical training and credentialing commonly expected |
| CF-D0042 | enums.preparation[1] | Agency training plus a related degree or experience; some jurisdictions certify or register these officers |
| CF-D0043 | enums.preparation[2] | An advanced music degree or a strong professional performance record is commonly expected; requirements in pre-college programs vary |
| CF-D0044 | enums.preparation[3] | Approved music-therapy education, supervised clinical training, and credentialing commonly expected |
| CF-D0045 | enums.preparation[4] | Associate speech-language pathology assistant (SLPA) program or bachelor's in communication sciences, plus supervised fieldwork; state rules vary |
| CF-D0046 | enums.preparation[5] | Audition and enlistment; basic training and military music school for most posts |
| CF-D0047 | enums.preparation[6] | Bachelor's degree (often in music education) and a state teaching license for public-school posts; private and community groups vary |
| CF-D0048 | enums.preparation[7] | Bachelor's degree (often in music education) and a state teaching license for public-school posts; private teaching varies |
| CF-D0049 | enums.preparation[8] | Bachelor's degree common (often in music); top posts often want advanced conducting study and assistant-conductor experience |
| CF-D0050 | enums.preparation[9] | Bachelor's degree common; portfolio/ certification may supplement |
| CF-D0051 | enums.preparation[10] | Bachelor's degree common; portfolio/certification may supplement |
| CF-D0052 | enums.preparation[11] | Bachelor's degree in engineering or science required; graduate study can raise starting pay |
| CF-D0053 | enums.preparation[12] | Bachelor's to doctorate, depending on research responsibility |
| CF-D0054 | enums.preparation[13] | Board-certified music-therapist credential and substantial clinical experience commonly expected; graduate degree or management training may help |
| CF-D0055 | enums.preparation[14] | Classroom training and supervised hours toward NDT (nondestructive testing) Level I–III certification |
| CF-D0056 | enums.preparation[15] | Clinical doctorate and a license where you practice typically required |
| CF-D0057 | enums.preparation[16] | Construction trade experience; many jurisdictions require a contractor license |
| CF-D0058 | enums.preparation[17] | Craft school, apprenticeship, mentored shop training, or professional credentialing |
| CF-D0059 | enums.preparation[18] | Doctorate (PhD) required; postdoctoral positions require a completed doctorate |
| CF-D0060 | enums.preparation[19] | Doctorate (PhD) usually required; research publications and grant record matter |
| CF-D0061 | enums.preparation[20] | Electrical apprenticeship or trade training; an electrician's license or entertainment-electrician certification is often required |
| CF-D0062 | enums.preparation[21] | Graduate clinical training and a license or credential where you practice commonly required |
| CF-D0063 | enums.preparation[22] | Graduate degree commonly expected (clinical doctorate or PhD in audiology or hearing science); licensure often required for clinical teaching |
| CF-D0064 | enums.preparation[23] | Graduate degree commonly expected (phonetics, speech science or signal processing); casework training and experience |
| CF-D0065 | enums.preparation[24] | Graduate degree commonly expected; professional portfolio may also matter |
| CF-D0066 | enums.preparation[25] | Graduate degree in medical physics; clinical roles add a residency and board certification |
| CF-D0067 | enums.preparation[26] | Hands-on training, certificate/associate degree, apprenticeship, or experience |
| CF-D0068 | enums.preparation[27] | Law degree, bar admission, and audio/music specialization |
| CF-D0069 | enums.preparation[28] | Master's (e.g., library/ information science (MLIS) or archival studies) typical; bachelor's plus experience/certificate can supplement |
| CF-D0070 | enums.preparation[29] | Master's degree commonly expected for college posts; strong performance or teaching record also matters |
| CF-D0071 | enums.preparation[30] | Master's in library/ information science (MLIS) typically required; may combine with archival training |
| CF-D0072 | enums.preparation[31] | Master's in library/ information science (MLS/MLIS) typically required for the professional 'Librarian' role; often paired with a music degree |
| CF-D0073 | enums.preparation[32] | Master's in library/ information science (MLS/MLIS) typically required; often paired with a music degree |
| CF-D0074 | enums.preparation[33] | Military or defense-employer training; eligibility, medical, and security requirements may apply |
| CF-D0075 | enums.preparation[34] | Most are licensed clinicians who add ultrasound training and credentialing |
| CF-D0076 | enums.preparation[35] | Portfolio, credits, craft training, and professional network |
| CF-D0077 | enums.preparation[36] | Science or engineering degree (or enough science course credits), then the patent office registration exam (US: USPTO) |
| CF-D0078 | enums.preparation[37] | Science or engineering degree, law degree, bar admission, and the patent office registration exam (US: USPTO) |
| CF-D0079 | enums.preparation[38] | Short certification course (US: CAOHC, the hearing-conservation council) plus on-the-job training |
| CF-D0080 | enums.preparation[39] | Substantial field experience; degree or business training may help |
| CF-D0081 | enums.preparation[40] | Substantial rigging experience and training; rigging certification often expected |
| CF-D0082 | enums.preparation[41] | Technical training and field experience; fire-alarm design certification or licensing is often required |
| CF-D0083 | enums.preparation[42] | Training or a supervised apprenticeship, then a licensing exam; rules vary by state or country |
| CF-D0084 | enums.preparation[43] | Usually a licensed audiologist or hearing-aid dispenser with added device-fitting training |
| CF-D0085 | enums.preparation[44] | Varies: portfolio/experience, certificate, associate, or bachelor's pathway |

### Family path line (field › subject)
| ID | Reference | Text |
|---|---|---|
| CF-D0086 | recording-studios-and-music-production.field / .subject | Studio Recording › Recording Craft |
| CF-D0087 | mixing-and-mastering.field / .subject | Mixing & Mastering › Mixing |
| CF-D0088 | music-creation-daws-synthesis-and-sonic-art.field / .subject | Electronic Music, DAWs & Synthesis › Synthesis & Sound Design |
| CF-D0089 | live-sound-touring-and-festivals.field / .subject | Live Sound & Production › Live Mixing & Crew |
| CF-D0090 | theatre-worship-venues-and-show-control.field / .subject | Venue, Stagecraft & Entertainment Systems › Theatrical & Worship |
| CF-D0091 | film-television-and-post-production-audio.field / .subject | Sound for Picture & Media › Post Production |
| CF-D0092 | game-interactive-xr-and-immersive-audio.field / .subject | Sound for Picture & Media › Localization & Game |
| CF-D0093 | broadcast-radio-sports-and-streaming.field / .subject | Broadcast, Podcast & Streaming › Broadcast & Air Chain |
| CF-D0094 | podcast-audiobook-voice-and-spoken-word-production.field / .subject | Broadcast, Podcast & Streaming › Podcast |
| CF-D0095 | installed-av-integration-and-institutional-systems.field / .subject | Installed & Commercial Audio › System Design & Install |
| CF-D0096 | architectural-acoustics-noise-and-vibration.field / .subject | Acoustics & Measurement › Acoustics & Room Behavior |
| CF-D0097 | scientific-environmental-and-applied-acoustics.field / .subject | Acoustics Science & Applied Research › Life, Earth & Space Acoustics |
| CF-D0098 | hearing-audiology-psychoacoustics-and-accessibility.field / .subject | Hearing, Perception & Listening › Hearing & Psychoacoustics |
| CF-D0099 | medical-ultrasound-and-therapeutic-acoustics.field / .subject | Acoustics Science & Applied Research › Physical & Advanced Acoustics |
| CF-D0100 | audio-hardware-transducers-and-electronics-engineering.field / .subject | Electronics, Engineering & Manufacturing › Components & Circuits |
| CF-D0101 | audio-software-dsp-ai-and-machine-learning.field / .subject | AI Audio › AI Audio |
| CF-D0102 | manufacturing-quality-calibration-and-repair.field / .subject | Troubleshooting, Maintenance & Repair › Maintenance & Repair |
| CF-D0103 | audio-archiving-preservation-and-restoration.field / .subject | Preservation & Archival › Preservation & Restoration |
| CF-D0104 | forensic-surveillance-security-and-public-safety-audio.field / .subject | Acoustics Science & Applied Research › Forensic & Investigative |
| CF-D0105 | technical-standards-regulation-law-and-rights.field / .subject | Standards & Sound Law › Technical Standards |
| CF-D0106 | education-research-training-and-technical-communication.field / .subject | Career, Business & Industry › Professional Practice |
| CF-D0107 | audio-business-product-sales-and-operations.field / .subject | Career, Business & Industry › Professional Practice |
| CF-D0108 | consumer-home-vehicle-and-personal-audio.field / .subject | Installed & Commercial Audio › Consumer & Vehicle Audio |
| CF-D0109 | dj-club-and-event-performance-technology.field / .subject | Live Sound & Production › DJ Performance |
| CF-D0110 | sonic-branding-ux-exhibits-and-experience-design.field / .subject | Sound for Picture & Media › Immersive |
| CF-D0111 | music-for-picture-scoring-and-editorial.field / .subject | Sound for Picture & Media › Scoring |
| CF-D0112 | audio-networks-cloud-and-technical-infrastructure.field / .subject | Audio Equipment & Signal Chain › Audio Networking |
| CF-D0113 | audio-measurement-system-tuning-and-instrumentation.field / .subject | Acoustics & Measurement › Measurement & Analysis |
| CF-D0114 | stagecraft-rigging-power-and-production-support.field / .subject | Venue, Stagecraft & Entertainment Systems › Stage & Venue |
| CF-D0115 | session-performance-voice-and-musical-direction.field / .subject | Studio Recording › Recording Craft |
| CF-D0116 | music-performance-conducting-and-live-musical-direction.field / .subject | Studio Recording › Recording Craft |
| CF-D0117 | musical-instrument-building-tuning-and-repair.field / .subject | Electronics, Engineering & Manufacturing › Build & Manufacturing |
| CF-D0118 | music-education-lessons-and-musicianship-coaching.field / .subject | Hearing, Perception & Listening › Critical Listening & Ear Training |
| CF-D0119 | music-therapy-speech-and-clinical-voice.field / .subject | Hearing, Perception & Listening › Hearing & Psychoacoustics |
| CF-D0120 | phonetics-linguistics-and-speech-science.field / .subject | Hearing, Perception & Listening › Hearing & Psychoacoustics |
| CF-D0121 | telecom-voice-quality-and-communications-audio.field / .subject | Audio Equipment & Signal Chain › Audio Networking |
| CF-D0122 | acoustic-construction-and-noise-control-trades.field / .subject | Acoustics & Measurement › Acoustics & Room Behavior |
| CF-D0123 | music-curation-repertoire-libraries-and-editorial.field / .subject | Career, Business & Industry › Professional Practice |
| CF-D0124 | defense-sonar-and-acoustic-intelligence.field / .subject | Acoustics Science & Applied Research › Life, Earth & Space Acoustics |
| CF-D0125 | accessible-media-and-audio-description.field / .subject | Sound for Picture & Media › Localization & Game |
| CF-D0126 | music-retail-rental-and-instrument-services.field / .subject | Career, Business & Industry › Professional Practice |
| CF-D0127 | field-recording-sound-libraries-and-sonic-heritage.field / .subject | Acoustics Science & Applied Research › Human & Heritage Acoustics |

### Family "where people work" line
| ID | Reference | Text |
|---|---|---|
| CF-D0128 | recording-studios-and-music-production.settings | Recording studios · production rooms · remote and location sessions |
| CF-D0129 | mixing-and-mastering.settings | Mix rooms · mastering studios · independent production facilities · remote services |
| CF-D0130 | music-creation-daws-synthesis-and-sonic-art.settings | Project studios · production companies · labels · live performance · art and cultural spaces |
| CF-D0131 | live-sound-touring-and-festivals.settings | Concerts · tours · festivals · clubs · arenas · corporate and special events |
| CF-D0132 | theatre-worship-venues-and-show-control.settings | Theaters · performing-arts centers · houses of worship · theme parks · permanent venues |
| CF-D0133 | film-television-and-post-production-audio.settings | Film and television sets · post facilities · scoring stages · localization studios |
| CF-D0134 | game-interactive-xr-and-immersive-audio.settings | Game studios · XR (extended reality: virtual, augmented and mixed reality) companies · interactive media teams · location-based entertainment |
| CF-D0135 | broadcast-radio-sports-and-streaming.settings | Radio and television stations · sports venues · production trucks · streaming platforms |
| CF-D0136 | podcast-audiobook-voice-and-spoken-word-production.settings | Podcast networks · audiobook publishers · voice studios · independent production |
| CF-D0137 | installed-av-integration-and-institutional-systems.settings | Corporate · education · government · hospitality · healthcare · museums · integrators |
| CF-D0138 | architectural-acoustics-noise-and-vibration.settings | Consultancies · architecture and engineering firms · government · transportation · product development |
| CF-D0139 | scientific-environmental-and-applied-acoustics.settings | Universities · national laboratories · environmental organizations · ocean science · defense · industry |
| CF-D0140 | hearing-audiology-psychoacoustics-and-accessibility.settings | Clinics · hospitals · schools · universities · hearing-device companies · accessibility teams |
| CF-D0141 | medical-ultrasound-and-therapeutic-acoustics.settings | Hospitals · diagnostic imaging centers · medical-device companies · biomedical research laboratories |
| CF-D0142 | audio-hardware-transducers-and-electronics-engineering.settings | Audio manufacturers · consumer electronics · R&D laboratories · engineering consultancies |
| CF-D0143 | audio-software-dsp-ai-and-machine-learning.settings | Software companies · audio manufacturers · AI laboratories · streaming platforms · game and media companies |
| CF-D0144 | manufacturing-quality-calibration-and-repair.settings | Factories · repair shops · rental companies · studios · field-service organizations |
| CF-D0145 | audio-archiving-preservation-and-restoration.settings | Archives · libraries · museums · broadcasters · labels · universities · preservation vendors |
| CF-D0146 | forensic-surveillance-security-and-public-safety-audio.settings | Forensic laboratories · law enforcement · courts · intelligence · security technology companies |
| CF-D0147 | technical-standards-regulation-law-and-rights.settings | Standards bodies · government · manufacturers · broadcasters · law firms · rights organizations |
| CF-D0148 | education-research-training-and-technical-communication.settings | Colleges · universities · schools · manufacturers · training companies · research laboratories |
| CF-D0149 | audio-business-product-sales-and-operations.settings | Manufacturers · distributors · dealers · studios · labels · rental companies · production businesses |
| CF-D0150 | consumer-home-vehicle-and-personal-audio.settings | Automotive OEMs (carmakers) · consumer-electronics companies · dealerships · home-integration firms · mobile-device companies |
| CF-D0151 | dj-club-and-event-performance-technology.settings | Clubs · festivals · weddings · mobile events · radio · livestreams |
| CF-D0152 | sonic-branding-ux-exhibits-and-experience-design.settings | Brand agencies · product design teams · museums · public spaces · themed entertainment |
| CF-D0153 | music-for-picture-scoring-and-editorial.settings | Film · television · advertising · trailers · scoring stages · music-production studios |
| CF-D0154 | audio-networks-cloud-and-technical-infrastructure.settings | Enterprise AV · broadcasters · live production · studios · cloud media platforms · manufacturers |
| CF-D0155 | audio-measurement-system-tuning-and-instrumentation.settings | Live systems · laboratories · manufacturers · acoustic consultancies · calibration services |
| CF-D0156 | stagecraft-rigging-power-and-production-support.settings | Theaters · arenas · festivals · touring productions · convention centers · rental companies |
| CF-D0157 | session-performance-voice-and-musical-direction.settings | Recording studios · scoring stages · broadcast studios · live venues · voice-production facilities |
| CF-D0158 | music-performance-conducting-and-live-musical-direction.settings | Concert halls · theaters · clubs · houses of worship · cruise ships · touring productions · recording sessions |
| CF-D0159 | musical-instrument-building-tuning-and-repair.settings | Instrument workshops · factories · music stores · schools · orchestras · touring productions · private service businesses |
| CF-D0160 | music-education-lessons-and-musicianship-coaching.settings | Schools · colleges · conservatories · community programs · studios · online learning · private practice |
| CF-D0161 | music-therapy-speech-and-clinical-voice.settings | Hospitals · rehabilitation centers · schools · clinics · elder care · private practices · research programs |
| CF-D0162 | phonetics-linguistics-and-speech-science.settings | Universities · speech laboratories · language-technology companies · forensic labs · media production · language archives |
| CF-D0163 | telecom-voice-quality-and-communications-audio.settings | Telecommunications carriers · device makers · conferencing companies · contact centers · network labs · public-safety communications |
| CF-D0164 | acoustic-construction-and-noise-control-trades.settings | Construction sites · studios · theaters · industrial plants · schools · offices · residences · specialty fabrication shops |
| CF-D0165 | music-curation-repertoire-libraries-and-editorial.settings | Record labels · streaming platforms · radio · publishers · libraries · orchestras · archives · film and advertising companies |
| CF-D0166 | defense-sonar-and-acoustic-intelligence.settings | Naval vessels · defense laboratories · maritime patrol · sonar manufacturers · ocean surveillance · government contractors |
| CF-D0167 | accessible-media-and-audio-description.settings | Film and television post-production · streaming services · theaters · museums · live events · accessibility vendors · education |
| CF-D0168 | music-retail-rental-and-instrument-services.settings | Music stores · pro-audio retailers · rental houses · distributors · auction houses · schools · touring suppliers |
| CF-D0169 | field-recording-sound-libraries-and-sonic-heritage.settings | Outdoor fieldwork · museums · archives · production libraries · research expeditions · cultural heritage programs |

### Source names
| ID | Reference | Text |
|---|---|---|
| CF-D0170 | families[].sources | U.S. Bureau of Labor Statistics / O*NET |
| CF-D0171 | families[].sources | Audio Engineering Society |
| CF-D0172 | families[].sources | U.S. Bureau of Labor Statistics |
| CF-D0173 | families[].sources | IATSE |
| CF-D0174 | families[].sources | Motion Picture Sound Editors |
| CF-D0175 | families[].sources | Cinema Audio Society |
| CF-D0176 | families[].sources | Game Audio Network Guild |
| CF-D0177 | families[].sources | Society of Broadcast Engineers |
| CF-D0178 | families[].sources | Society of Motion Picture and Television Engineers |
| CF-D0179 | families[].sources | Audio Publishers Association |
| CF-D0180 | families[].sources | Acoustical Society of America |
| CF-D0181 | families[].sources | NIOSH |
| CF-D0182 | families[].sources | American Society for Nondestructive Testing |
| CF-D0183 | families[].sources | NOAA |
| CF-D0184 | families[].sources | NASA |
| CF-D0185 | families[].sources | American Speech-Language-Hearing Association |
| CF-D0186 | families[].sources | Audio Engineering Society Technical Council |
| CF-D0187 | families[].sources | IEEE Signal Processing Society |
| CF-D0188 | families[].sources | Association of Moving Image Archivists |
| CF-D0189 | families[].sources | Library of Congress |
| CF-D0190 | families[].sources | National Institute of Standards and Technology |
| CF-D0191 | families[].sources | Federal Communications Commission |
| CF-D0192 | families[].sources | U.S. Copyright Office |
| CF-D0193 | families[].sources | Audio Engineering Society Career Center |
| CF-D0194 | families[].sources | Consumer Technology Association |
| CF-D0195 | families[].sources | Piano Technicians Guild |
| CF-D0196 | families[].sources | National Association of Professional Band Instrument Repair Technicians |
| CF-D0197 | families[].sources | American Federation of Violin and Bow Makers |
| CF-D0198 | families[].sources | Certification Board for Music Therapists |
| CF-D0199 | families[].sources | Linguistic Society of America |
| CF-D0200 | families[].sources | Occupational Safety and Health Administration |
| CF-D0201 | families[].sources | Music Library Association |
| CF-D0202 | families[].sources | NAMM |
| CF-D0203 | families[].sources | U.S. Navy |
| CF-D0204 | families[].sources | American Council of the Blind |

## Part T: the job titles, by family
The ID is the title's own ID in the career index (AC-####). "Also called" shows on the title's detail.

### Recording Studios & Music Production (33)
| ID | Title | Also called |
|---|---|---|
| AC-0001 | Recording Engineer | recording technician · audio engineer |
| AC-0002 | Studio Engineer |  |
| AC-0003 | Tracking Engineer |  |
| AC-0004 | Assistant Recording Engineer |  |
| AC-0005 | Second Engineer |  |
| AC-0006 | Studio Assistant |  |
| AC-0007 | Recording Technician |  |
| AC-0008 | Music Producer |  |
| AC-0009 | Record Producer |  |
| AC-0010 | Vocal Producer |  |
| AC-0011 | Session Producer |  |
| AC-0012 | Executive Producer — Recording |  |
| AC-0013 | Classical Recording Producer |  |
| AC-0014 | Classical Recording Engineer |  |
| AC-0015 | Orchestral Recording Engineer |  |
| AC-0016 | Choir Recording Engineer |  |
| AC-0017 | Jazz Recording Engineer |  |
| AC-0018 | Location Recording Engineer |  |
| AC-0019 | Remote Recording Engineer |  |
| AC-0020 | Mobile Recording Engineer |  |
| AC-0021 | DAW Operator |  |
| AC-0022 | Pro Tools Operator |  |
| AC-0023 | Tape Operator |  |
| AC-0025 | Studio Manager |  |
| AC-0026 | Recording Studio Owner |  |
| AC-0027 | Studio Technical Manager |  |
| AC-0028 | Microphone Technician — Studio |  |
| AC-0029 | Piano Recording Specialist |  |
| AC-0030 | Vocal Recording Engineer |  |
| AC-0031 | Drum Recording Specialist |  |
| AC-0032 | Band Tracking Engineer |  |
| AC-0033 | Live-in-Studio Recording Engineer |  |
| AC-0034 | Studio Intern |  |

### Mixing & Mastering (27)
| ID | Title | Also called |
|---|---|---|
| AC-0035 | Mixing Engineer | mix engineer · audio mixer |
| AC-0036 | Mix Engineer |  |
| AC-0037 | Assistant Mixing Engineer |  |
| AC-0038 | Mix Technician |  |
| AC-0039 | Immersive Music Mixing Engineer |  |
| AC-0040 | Dolby Atmos Music Mixer |  |
| AC-0041 | Surround Music Mixer |  |
| AC-0042 | Vocal Mixing Specialist |  |
| AC-0043 | Drum Mixing Specialist |  |
| AC-0044 | Orchestral Mixing Engineer |  |
| AC-0045 | Choir and Acoustic-Ensemble Mixing Engineer |  |
| AC-0046 | Electronic Music Mixing Engineer |  |
| AC-0047 | Mix Preparation Engineer |  |
| AC-0048 | Stem Mixing Engineer |  |
| AC-0049 | Remote Mixing Engineer |  |
| AC-0050 | Mastering Engineer | audio mastering engineer |
| AC-0051 | Assistant Mastering Engineer |  |
| AC-0052 | Immersive Mastering Engineer |  |
| AC-0053 | Vinyl Mastering Engineer |  |
| AC-0054 | Disc-Cutting Engineer |  |
| AC-0055 | Digital Mastering Engineer |  |
| AC-0056 | Catalog Remastering Engineer |  |
| AC-0057 | Restoration Mastering Engineer |  |
| AC-0058 | Mastering Studio Manager |  |
| AC-0059 | Quality-Control Listening Engineer |  |
| AC-0060 | Album Sequencing and Assembly Engineer |  |
| AC-0061 | Mix and Mastering Consultant |  |

### Music Creation, DAWs, Synthesis & Sonic Art (37)
| ID | Title | Also called |
|---|---|---|
| AC-0062 | Songwriter |  |
| AC-0063 | Composer |  |
| AC-0064 | Arranger |  |
| AC-0065 | Orchestrator |  |
| AC-0066 | Music Producer — Electronic Music |  |
| AC-0067 | Beat Maker |  |
| AC-0068 | Electronic Music Producer |  |
| AC-0069 | Hip-Hop Producer |  |
| AC-0070 | Dance Music Producer |  |
| AC-0071 | Remix Producer |  |
| AC-0072 | Mashup Artist |  |
| AC-0073 | Synthesizer Programmer |  |
| AC-0074 | Synthesist |  |
| AC-0075 | MIDI Programmer |  |
| AC-0076 | Music Programmer |  |
| AC-0077 | Sequence Programmer |  |
| AC-0078 | Virtual-Instrument Programmer |  |
| AC-0079 | Sample-Library Producer |  |
| AC-0080 | Sample-Library Recording Engineer |  |
| AC-0081 | Sample Editor |  |
| AC-0082 | Preset Designer |  |
| AC-0083 | Sound Bank Designer |  |
| AC-0084 | Instrument Sound Designer |  |
| AC-0085 | Sound Artist |  |
| AC-0086 | Sonic Artist |  |
| AC-0087 | Sound Installation Artist |  |
| AC-0088 | Electroacoustic Composer |  |
| AC-0089 | Acousmatic Composer |  |
| AC-0090 | Algorithmic Composer |  |
| AC-0091 | Generative Music Designer |  |
| AC-0092 | Live Electronic Music Performer |  |
| AC-0093 | Laptop Performer |  |
| AC-0094 | Playback Programmer — Music |  |
| AC-0095 | Music Technologist |  |
| AC-0096 | Creative Audio Technologist |  |
| AC-0097 | Music Copyist |  |
| AC-0098 | Music Preparation Specialist |  |

### Live Sound, Touring & Festivals (46)
| ID | Title | Also called |
|---|---|---|
| AC-0099 | Front-of-House Engineer | FOH engineer · house mixer · front-of-house mixer |
| AC-0100 | FOH Mixer |  |
| AC-0101 | Monitor Engineer | monitor mixer · foldback engineer |
| AC-0102 | Monitor Mixer |  |
| AC-0103 | Live Sound Engineer |  |
| AC-0104 | Concert Audio Engineer |  |
| AC-0105 | Touring Audio Engineer |  |
| AC-0106 | Touring Audio Crew Chief |  |
| AC-0107 | Audio Department Head — Touring |  |
| AC-0108 | A1 Audio Engineer — Live |  |
| AC-0109 | A2 Audio Technician — Live |  |
| AC-0110 | PA Technician |  |
| AC-0111 | Loudspeaker System Technician |  |
| AC-0112 | Live Systems Engineer |  |
| AC-0113 | System Optimization Engineer |  |
| AC-0114 | System Tuning Engineer |  |
| AC-0115 | Sound System Designer — Touring |  |
| AC-0116 | Audio System Tech |  |
| AC-0117 | Stage Audio Technician |  |
| AC-0118 | Stage Patch Technician |  |
| AC-0119 | Patch Master |  |
| AC-0120 | Festival Audio Engineer |  |
| AC-0121 | Festival Audio Crew Chief |  |
| AC-0122 | Club Sound Engineer |  |
| AC-0123 | House Audio Engineer |  |
| AC-0124 | Venue Audio Engineer |  |
| AC-0125 | Corporate Event Audio Engineer |  |
| AC-0126 | Special-Events Audio Engineer |  |
| AC-0127 | RF Coordinator — Live Events |  |
| AC-0128 | Wireless Microphone Technician |  |
| AC-0129 | Live Audio Network Engineer |  |
| AC-0130 | Live Audio Playback Technician |  |
| AC-0131 | Live Recording Engineer |  |
| AC-0133 | Communications Technician — Live Events |  |
| AC-0134 | Intercom Technician — Live Events |  |
| AC-0135 | Audio Utility Technician |  |
| AC-0136 | Audio Production Assistant — Live |  |
| AC-0137 | Cable Technician — Live Audio |  |
| AC-0138 | Audio Warehouse Technician |  |
| AC-0139 | Audio Rental Technician |  |
| AC-0140 | Audio Rental Shop Manager |  |
| AC-0141 | Touring Audio Production Manager |  |
| AC-0142 | Audio Advance Coordinator |  |
| AC-0143 | Concert Systems Consultant |  |
| AC-0144 | Roadie — Audio |  |
| AC-0145 | Live Sound Freelancer |  |

### Theater, Worship, Venues & Show Control (34)
| ID | Title | Also called |
|---|---|---|
| AC-0146 | Theatrical Sound Designer |  |
| AC-0147 | Associate Sound Designer — Theater |  |
| AC-0148 | Assistant Sound Designer — Theater |  |
| AC-0149 | Theater Sound Supervisor |  |
| AC-0150 | Theater Audio Engineer |  |
| AC-0151 | Theater A1 |  |
| AC-0152 | Theater A2 |  |
| AC-0153 | Sound Board Operator | sound operator · audio console operator |
| AC-0154 | Sound Console Operator — Theater |  |
| AC-0155 | Theater Playback Operator |  |
| AC-0156 | QLab Programmer |  |
| AC-0157 | Show-Control Programmer |  |
| AC-0158 | Show-Control Engineer |  |
| AC-0159 | Show-Control Technician |  |
| AC-0160 | Sound Effects Operator — Theater |  |
| AC-0161 | Radio-Microphone Technician — Theater |  |
| AC-0162 | Orchestra-Pit Audio Engineer |  |
| AC-0163 | Musical-Theater Vocal Mixer |  |
| AC-0164 | Theater Communications Technician |  |
| AC-0165 | Theater Sound Department Head |  |
| AC-0166 | Venue Technical Director |  |
| AC-0167 | Venue Audio Supervisor |  |
| AC-0168 | Performing-Arts Center Audio Manager |  |
| AC-0169 | Resident Sound Designer |  |
| AC-0170 | Theme-Park Audio Designer |  |
| AC-0171 | Attraction Audio Programmer |  |
| AC-0172 | Attraction Audio Technician |  |
| AC-0173 | Worship Audio Director |  |
| AC-0174 | House-of-Worship Audio Engineer |  |
| AC-0175 | Worship Broadcast Audio Engineer |  |
| AC-0176 | Worship Systems Technician |  |
| AC-0177 | Worship Technical Director |  |
| AC-0178 | Church Audio Coordinator |  |
| AC-0179 | Church Audio Systems Consultant |  |

### Film, Television & Post-Production Audio (72)
| ID | Title | Also called |
|---|---|---|
| AC-0180 | Production Sound Mixer | location mixer · sound mixer |
| AC-0181 | Location Sound Mixer — Film/TV |  |
| AC-0182 | Boom Operator | boom technician · microphone boom operator |
| AC-0183 | Utility Sound Technician | sound utility · utility sound |
| AC-0185 | Production Sound Assistant |  |
| AC-0186 | Playback Operator — Film Set |  |
| AC-0188 | Sound Department Coordinator — Production |  |
| AC-0189 | Production Sound Recordist |  |
| AC-0190 | Documentary Sound Recordist |  |
| AC-0191 | Reality Television Audio Mixer |  |
| AC-0192 | ENG Sound Recordist |  |
| AC-0193 | Supervising Sound Editor |  |
| AC-0194 | Co-Supervising Sound Editor |  |
| AC-0195 | Sound Editor |  |
| AC-0196 | Assistant Sound Editor |  |
| AC-0197 | Sound Editorial Assistant |  |
| AC-0198 | Dialogue Editor |  |
| AC-0199 | Supervising Dialogue Editor |  |
| AC-0200 | ADR Editor |  |
| AC-0201 | Supervising ADR Editor |  |
| AC-0202 | ADR Recordist |  |
| AC-0203 | ADR Mixer |  |
| AC-0204 | ADR Supervisor |  |
| AC-0205 | Loop Group Director |  |
| AC-0206 | Sound Effects Editor |  |
| AC-0207 | Supervising Sound Effects Editor |  |
| AC-0208 | Foley Editor |  |
| AC-0209 | Supervising Foley Editor |  |
| AC-0210 | Foley Artist |  |
| AC-0211 | Foley Walker |  |
| AC-0212 | Foley Mixer |  |
| AC-0213 | Foley Recordist |  |
| AC-0214 | Foley Supervisor |  |
| AC-0215 | Sound Designer — Film/TV |  |
| AC-0216 | Trailer Sound Designer |  |
| AC-0217 | Animation Sound Designer |  |
| AC-0218 | Documentary Sound Designer |  |
| AC-0219 | Field Recordist — Sound Effects |  |
| AC-0220 | Sound Effects Librarian |  |
| AC-0221 | Sound Library Manager |  |
| AC-0222 | Sound Effects Recordist |  |
| AC-0223 | Music Editor — Film/TV |  |
| AC-0224 | Assistant Music Editor |  |
| AC-0225 | Scoring Mixer |  |
| AC-0226 | Scoring Recordist |  |
| AC-0227 | Scoring Engineer |  |
| AC-0228 | Scoring Stage Technician |  |
| AC-0229 | Re-Recording Mixer | dubbing mixer · final mixer |
| AC-0230 | Dialogue Re-Recording Mixer |  |
| AC-0231 | Effects Re-Recording Mixer |  |
| AC-0232 | Final Mix Engineer — Picture |  |
| AC-0233 | Pre-Dub Mixer |  |
| AC-0234 | M&E Mixer |  |
| AC-0236 | Home-Entertainment Mixer |  |
| AC-0237 | Immersive Cinema Mixer |  |
| AC-0238 | Atmos Re-Recording Mixer |  |
| AC-0239 | Mix Technician — Dub Stage |  |
| AC-0240 | Dub Stage Engineer |  |
| AC-0242 | Dubbing Recordist |  |
| AC-0243 | Dubbing Director |  |
| AC-0244 | Localization Audio Engineer |  |
| AC-0245 | Localization Audio Producer |  |
| AC-0246 | Foreign-Language Dubbing Engineer |  |
| AC-0247 | Audio Conform Editor |  |
| AC-0248 | Sound Restoration Engineer — Film/TV |  |
| AC-0249 | Post-Production Audio Coordinator |  |
| AC-0250 | Post Audio Supervisor |  |
| AC-0251 | Audio Deliverables Specialist |  |
| AC-0252 | Audio QC Operator — Film/TV |  |
| AC-0253 | Loudness Compliance Mixer — Film/TV |  |
| AC-0254 | Printmastering Engineer |  |
| AC-0255 | Broadcast Versioning Audio Editor |  |

### Game, Interactive, XR & Immersive Audio (42)
| ID | Title | Also called |
|---|---|---|
| AC-0256 | Game Audio Director |  |
| AC-0257 | Audio Director — Interactive |  |
| AC-0258 | Lead Game Audio Designer |  |
| AC-0259 | Senior Game Sound Designer |  |
| AC-0260 | Game Sound Designer |  |
| AC-0261 | Junior Game Sound Designer |  |
| AC-0262 | Technical Sound Designer |  |
| AC-0263 | Audio Implementer |  |
| AC-0264 | Game Audio Implementation Specialist |  |
| AC-0265 | Game Audio Programmer |  |
| AC-0266 | Audio Engine Programmer |  |
| AC-0267 | Audio Tools Programmer |  |
| AC-0268 | Audio Middleware Specialist |  |
| AC-0269 | Wwise Developer |  |
| AC-0270 | FMOD Developer |  |
| AC-0271 | Interactive Music Designer |  |
| AC-0272 | Game Composer |  |
| AC-0273 | Game Music Editor |  |
| AC-0274 | Game Dialogue Designer |  |
| AC-0275 | Game Dialogue Editor |  |
| AC-0276 | Game VO Recordist |  |
| AC-0277 | Game Voice Director |  |
| AC-0278 | Game Audio Producer |  |
| AC-0279 | Game Audio Project Manager |  |
| AC-0280 | Game Audio Outsourcing Manager |  |
| AC-0281 | Game Foley Artist |  |
| AC-0282 | Game Sound Effects Recordist |  |
| AC-0283 | Procedural Audio Designer |  |
| AC-0284 | Generative Game Audio Designer |  |
| AC-0285 | Spatial Audio Designer — Games |  |
| AC-0286 | VR Audio Designer |  |
| AC-0287 | AR Audio Designer |  |
| AC-0288 | XR Audio Engineer |  |
| AC-0289 | Immersive Experience Sound Designer |  |
| AC-0290 | Location-Based Entertainment Audio Designer |  |
| AC-0291 | Haptic Audio Designer |  |
| AC-0292 | Interactive Audio Systems Designer |  |
| AC-0293 | Game Audio QA Tester |  |
| AC-0294 | Audio Bug Analyst — Games |  |
| AC-0295 | Accessibility Audio Designer — Games |  |
| AC-0296 | Audio Localization Specialist — Games |  |
| AC-0297 | Game Audio Librarian |  |

### Broadcast, Radio, Sports & Streaming (50)
| ID | Title | Also called |
|---|---|---|
| AC-0298 | Broadcast Audio Engineer | broadcast sound engineer · broadcast audio technician |
| AC-0299 | Television Audio Engineer |  |
| AC-0300 | Radio Broadcast Engineer |  |
| AC-0301 | Broadcast Sound Mixer |  |
| AC-0302 | Broadcast A1 |  |
| AC-0303 | Broadcast A2 |  |
| AC-0304 | Broadcast Audio Operator |  |
| AC-0305 | Studio Audio Operator — Broadcast |  |
| AC-0306 | Broadcast Technician |  |
| AC-0307 | Broadcast Operations Engineer |  |
| AC-0308 | Broadcast Maintenance Engineer |  |
| AC-0309 | Chief Broadcast Engineer |  |
| AC-0310 | Broadcast Systems Engineer |  |
| AC-0311 | Broadcast Network Engineer |  |
| AC-0312 | IP Broadcast Engineer |  |
| AC-0313 | Remote Production Audio Engineer |  |
| AC-0314 | REMI Audio Engineer |  |
| AC-0315 | Outside-Broadcast Audio Engineer |  |
| AC-0316 | Mobile Unit Audio Engineer |  |
| AC-0317 | Field Audio Engineer — Broadcast |  |
| AC-0318 | EFP Audio Technician |  |
| AC-0319 | ENG Audio Technician |  |
| AC-0320 | Sports Broadcast Audio Mixer |  |
| AC-0321 | Sports Effects Mixer |  |
| AC-0322 | Sports Submix Engineer |  |
| AC-0323 | Crowd Microphone Technician |  |
| AC-0324 | Parabolic Microphone Operator |  |
| AC-0325 | Broadcast RF Technician |  |
| AC-0326 | Broadcast Frequency Coordinator |  |
| AC-0327 | Broadcast Intercom Engineer |  |
| AC-0328 | Broadcast Communications Technician |  |
| AC-0329 | Broadcast Transmission Engineer |  |
| AC-0330 | Radio Studio Engineer |  |
| AC-0331 | Radio Board Operator |  |
| AC-0332 | Radio Production Engineer |  |
| AC-0333 | Radio Imaging Producer |  |
| AC-0334 | Radio Producer |  |
| AC-0335 | On-Air DJ |  |
| AC-0336 | Playout Automation Engineer |  |
| AC-0337 | Air-Chain Processing Engineer |  |
| AC-0338 | Broadcast Loudness Compliance Engineer |  |
| AC-0339 | Master Control Audio Operator |  |
| AC-0340 | Streaming Audio Engineer |  |
| AC-0341 | Livestream Audio Mixer |  |
| AC-0342 | Webcast Audio Technician |  |
| AC-0343 | Cloud Production Audio Engineer |  |
| AC-0344 | Streaming Operations Engineer |  |
| AC-0345 | Broadcast Audio QC Specialist |  |
| AC-0346 | Broadcast Audio Archivist |  |
| AC-0347 | Station Technical Manager |  |

### Podcast, Audiobook, Voice & Spoken-Word Production (35)
| ID | Title | Also called |
|---|---|---|
| AC-0348 | Podcast Producer |  |
| AC-0349 | Podcast Executive Producer |  |
| AC-0350 | Podcast Audio Engineer |  |
| AC-0351 | Podcast Recording Engineer |  |
| AC-0352 | Podcast Editor |  |
| AC-0353 | Podcast Mixing Engineer |  |
| AC-0354 | Podcast Sound Designer |  |
| AC-0355 | Podcast Host |  |
| AC-0356 | Podcast Studio Technician |  |
| AC-0357 | Podcast Network Audio Manager |  |
| AC-0358 | Podcast Operations Producer |  |
| AC-0359 | Remote Podcast Recording Specialist |  |
| AC-0360 | Audiobook Producer |  |
| AC-0361 | Audiobook Director |  |
| AC-0362 | Audiobook Narrator |  |
| AC-0363 | Audiobook Recording Engineer |  |
| AC-0364 | Audiobook Editor |  |
| AC-0365 | Audiobook Proof Listener |  |
| AC-0366 | Audiobook QC Specialist |  |
| AC-0367 | Audiobook Mastering Engineer |  |
| AC-0368 | Audiobook Post-Production Coordinator |  |
| AC-0369 | Voice-Over Artist |  |
| AC-0370 | Voice-Over Recording Engineer |  |
| AC-0371 | Voice Director |  |
| AC-0372 | Voice Casting Director |  |
| AC-0373 | Voice-Over Producer |  |
| AC-0374 | Voice Demo Producer |  |
| AC-0375 | Speech Editor |  |
| AC-0376 | Dialogue Cleanup Specialist |  |
| AC-0377 | Oral-History Recording Technician |  |
| AC-0378 | Spoken-Word Recording Engineer |  |
| AC-0379 | Localization Voice Recordist |  |
| AC-0380 | Audio Description Narrator |  |
| AC-0381 | Audio Description Recording Engineer |  |
| AC-0382 | Audio Description Mixer |  |

### Installed AV, Integration & Institutional Systems (61)
| ID | Title | Also called |
|---|---|---|
| AC-0383 | AV Installation Technician | AV installer · audiovisual technician |
| AC-0384 | Audio Installation Technician |  |
| AC-0385 | AV Integration Technician |  |
| AC-0386 | AV Field Technician |  |
| AC-0387 | AV Service Technician |  |
| AC-0388 | AV Commissioning Technician |  |
| AC-0389 | AV Commissioning Engineer |  |
| AC-0390 | AV Systems Designer |  |
| AC-0391 | Audio Systems Designer — Installed |  |
| AC-0392 | AV Design Engineer |  |
| AC-0393 | AV Systems Engineer |  |
| AC-0394 | AV Consultant |  |
| AC-0395 | Electroacoustic Systems Consultant |  |
| AC-0396 | AV Programmer |  |
| AC-0397 | Control Systems Programmer |  |
| AC-0398 | DSP Programmer — Installed Audio |  |
| AC-0399 | AV Network Engineer |  |
| AC-0400 | AV-over-IP Engineer |  |
| AC-0401 | AV Systems Architect |  |
| AC-0402 | Unified Communications Engineer |  |
| AC-0403 | Collaboration Systems Engineer |  |
| AC-0404 | Conference-Room Audio Specialist |  |
| AC-0405 | Acoustic Echo-Cancellation Specialist |  |
| AC-0406 | AV CAD Drafter |  |
| AC-0407 | AV BIM Designer |  |
| AC-0408 | AV Documentation Specialist |  |
| AC-0409 | Rack Fabrication Technician |  |
| AC-0410 | Structured Cabling Technician — AV |  |
| AC-0411 | Low-Voltage Technician — AV |  |
| AC-0412 | AV Project Manager |  |
| AC-0413 | AV Program Manager |  |
| AC-0414 | AV Project Coordinator |  |
| AC-0415 | AV Estimator |  |
| AC-0416 | AV Sales Engineer |  |
| AC-0417 | AV Solutions Architect |  |
| AC-0418 | AV Applications Engineer |  |
| AC-0419 | AV Technical Support Specialist |  |
| AC-0420 | AV Quality-Assurance Technician |  |
| AC-0421 | AV Field-Service Engineer |  |
| AC-0422 | Corporate AV Technician |  |
| AC-0423 | Corporate AV Manager |  |
| AC-0424 | Enterprise AV Engineer |  |
| AC-0425 | Higher-Education AV Technician |  |
| AC-0426 | Classroom Technology Specialist |  |
| AC-0427 | Campus AV Systems Engineer |  |
| AC-0428 | Healthcare AV Specialist |  |
| AC-0429 | Courtroom AV Specialist |  |
| AC-0430 | Hospitality AV Technician |  |
| AC-0431 | Convention-Center Audio Technician |  |
| AC-0432 | Museum AV Technician |  |
| AC-0433 | Exhibit Audio Designer |  |
| AC-0434 | Theme-Park Systems Integrator |  |
| AC-0435 | Paging Systems Designer |  |
| AC-0436 | Mass-Notification Audio Designer |  |
| AC-0437 | Assistive-Listening Systems Specialist |  |
| AC-0438 | Hearing-Loop Installer |  |
| AC-0439 | Public-Address Systems Engineer |  |
| AC-0440 | Government AV Specialist |  |
| AC-0441 | AV Operations Manager |  |
| AC-0442 | AV/IT Manager |  |
| AC-0443 | AV System Administrator |  |

### Architectural Acoustics, Noise & Vibration (50)
| ID | Title | Also called |
|---|---|---|
| AC-0444 | Acoustical Consultant | acoustic consultant · acoustics consultant |
| AC-0445 | Acoustical Engineer |  |
| AC-0446 | Architectural Acoustician |  |
| AC-0447 | Building Acoustics Consultant |  |
| AC-0448 | Room Acoustics Consultant |  |
| AC-0449 | Studio Acoustics Designer |  |
| AC-0450 | Concert-Hall Acoustician |  |
| AC-0451 | Theater Acoustician |  |
| AC-0452 | Worship-Space Acoustics Consultant |  |
| AC-0453 | Education-Facility Acoustics Consultant |  |
| AC-0454 | Healthcare Acoustics Consultant |  |
| AC-0455 | Sound-Isolation Consultant |  |
| AC-0456 | Noise-Control Engineer |  |
| AC-0457 | Noise-Control Consultant |  |
| AC-0458 | Environmental Acoustics Consultant |  |
| AC-0459 | Environmental Noise Analyst |  |
| AC-0460 | Community Noise Specialist |  |
| AC-0461 | Industrial Noise-Control Engineer |  |
| AC-0462 | Occupational Noise Consultant |  |
| AC-0463 | Transportation Noise Analyst |  |
| AC-0464 | Highway Noise Specialist |  |
| AC-0465 | Rail Noise and Vibration Consultant |  |
| AC-0466 | Airport Noise Specialist |  |
| AC-0467 | Airport Noise Compliance Officer |  |
| AC-0468 | Aviation Acoustics Engineer |  |
| AC-0469 | Aeroacoustics Engineer |  |
| AC-0470 | Wind-Turbine Noise Consultant |  |
| AC-0471 | Construction Noise and Vibration Consultant |  |
| AC-0472 | Vibration Consultant |  |
| AC-0473 | Vibration Engineer |  |
| AC-0474 | Structural Dynamics Engineer |  |
| AC-0475 | Structural Acoustics Engineer |  |
| AC-0476 | Building Services Noise Engineer |  |
| AC-0477 | HVAC Acoustics Engineer |  |
| AC-0478 | Electroacoustic Consultant |  |
| AC-0479 | Sound-System Acoustical Consultant |  |
| AC-0480 | Product Sound-Quality Engineer |  |
| AC-0481 | Sound-Quality Consultant |  |
| AC-0482 | Psychoacoustic Product Evaluator |  |
| AC-0483 | Acoustic Test Engineer |  |
| AC-0484 | Acoustic Measurement Technician |  |
| AC-0485 | Noise and Vibration Test Technician |  |
| AC-0486 | Modal Analysis Engineer |  |
| AC-0487 | Acoustic Modeling Specialist |  |
| AC-0488 | Computational Acoustics Engineer |  |
| AC-0489 | Acoustic Simulation Specialist |  |
| AC-0490 | Acoustic Laboratory Manager |  |
| AC-0491 | Acoustic Project Manager |  |
| AC-0492 | Principal Acoustical Consultant |  |
| AC-0493 | Acoustic Code and Standards Consultant |  |

### Scientific, Environmental & Applied Acoustics (61)
| ID | Title | Also called |
|---|---|---|
| AC-0494 | Physical Acoustician |  |
| AC-0495 | Acoustics Research Scientist |  |
| AC-0496 | Experimental Acoustician |  |
| AC-0497 | Theoretical Acoustician |  |
| AC-0498 | Computational Acoustics Researcher |  |
| AC-0499 | Nonlinear Acoustics Scientist |  |
| AC-0500 | Structural Acoustics Scientist |  |
| AC-0501 | Acoustic Materials Scientist |  |
| AC-0502 | Metamaterials Acoustics Researcher |  |
| AC-0503 | Phononics Researcher |  |
| AC-0504 | Molecular Acoustics Scientist |  |
| AC-0505 | Chemical Acoustics Researcher |  |
| AC-0506 | Thermoacoustics Engineer |  |
| AC-0507 | Photoacoustics Scientist |  |
| AC-0508 | Bioacoustician |  |
| AC-0509 | Ecoacoustics Researcher |  |
| AC-0510 | Soundscape Ecologist |  |
| AC-0511 | Conservation Acoustics Scientist |  |
| AC-0512 | Animal Communication Researcher |  |
| AC-0513 | Bird Bioacoustics Researcher |  |
| AC-0514 | Bat Bioacoustics Researcher |  |
| AC-0515 | Marine Bioacoustician |  |
| AC-0516 | Fisheries Acoustics Scientist |  |
| AC-0517 | Cetacean Acoustics Researcher |  |
| AC-0518 | Underwater Acoustics Engineer |  |
| AC-0519 | Underwater Acoustic Analyst |  |
| AC-0520 | Hydroacoustics Scientist |  |
| AC-0521 | Acoustic Oceanographer |  |
| AC-0525 | Hydrophone Systems Engineer |  |
| AC-0526 | Ocean Noise Analyst |  |
| AC-0527 | Marine Acoustic Monitoring Specialist |  |
| AC-0528 | Passive Acoustic Monitoring Analyst |  |
| AC-0529 | Geophysical Acoustics Scientist |  |
| AC-0530 | Seismoacoustics Researcher |  |
| AC-0531 | Infrasound Scientist |  |
| AC-0532 | Atmospheric Acoustics Scientist |  |
| AC-0533 | Volcano Acoustics Researcher |  |
| AC-0534 | Acoustic Remote-Sensing Scientist |  |
| AC-0535 | Planetary Acoustics Researcher |  |
| AC-0536 | Astronomical Sonification Researcher |  |
| AC-0537 | Cosmological Data Sonification Specialist |  |
| AC-0538 | Archaeoacoustician |  |
| AC-0539 | Heritage Acoustics Researcher |  |
| AC-0540 | Acoustic Anthropologist |  |
| AC-0541 | Sound Studies Researcher |  |
| AC-0542 | Ethnomusicologist — Audio Research |  |
| AC-0543 | Data Sonification Designer |  |
| AC-0544 | Auditory Display Researcher |  |
| AC-0545 | Scientific Sonification Engineer |  |
| AC-0546 | Acoustic Imaging Scientist |  |
| AC-0547 | Acoustic Camera Specialist |  |
| AC-0548 | Beamforming Research Engineer |  |
| AC-0549 | Sound-Field Reconstruction Researcher |  |
| AC-0550 | Acoustic Holography Engineer |  |
| AC-0551 | Ultrasonics Engineer |  |
| AC-0552 | Ultrasonics Research Scientist |  |
| AC-0553 | Nondestructive Testing Specialist — Ultrasonic |  |
| AC-0554 | Ultrasonic Testing Technician |  |
| AC-0555 | Industrial Acoustic Inspection Engineer |  |
| AC-0556 | Acoustic Emission Testing Specialist |  |
| AC-0557 | Materials Evaluation Scientist — Ultrasonics |  |

### Defense, Sonar & Acoustic Intelligence (44)
| ID | Title | Also called |
|---|---|---|
| AC-0522 | Sonar Systems Engineer |  |
| AC-0523 | Sonar Signal-Processing Engineer |  |
| AC-0524 | Sonar Technician |  |
| AC-1752 | Surface Sonar Technician |  |
| AC-1753 | Submarine Sonar Technician |  |
| AC-1754 | Sonar Operator |  |
| AC-1755 | Sonar Systems Operator |  |
| AC-1756 | Sonar Analyst |  |
| AC-1757 | Acoustic Intelligence Analyst |  |
| AC-1758 | Passive Sonar Analyst |  |
| AC-1759 | Active Sonar Analyst |  |
| AC-1760 | Anti-Submarine Warfare Acoustic Operator |  |
| AC-1761 | Maritime Acoustic Intelligence Specialist |  |
| AC-1762 | Naval Acoustic Intelligence Analyst |  |
| AC-1763 | Acoustic Signature Analyst |  |
| AC-1764 | Vessel Acoustic-Signature Analyst |  |
| AC-1765 | Sonar Systems Technician |  |
| AC-1766 | Sonar Maintenance Technician |  |
| AC-1767 | Towed-Array Sonar Technician |  |
| AC-1768 | Hull-Mounted Sonar Technician |  |
| AC-1769 | Sonobuoy Systems Technician |  |
| AC-1770 | Sonobuoy Acoustic Analyst |  |
| AC-1771 | Maritime Patrol Acoustic Operator |  |
| AC-1772 | Airborne Acoustic Sensor Operator |  |
| AC-1773 | Undersea Surveillance Operator |  |
| AC-1774 | Ocean Surveillance Systems Technician |  |
| AC-1775 | Naval Acoustics Engineer |  |
| AC-1776 | Underwater Acoustics Engineer — Defense |  |
| AC-1777 | Sonar Software Engineer |  |
| AC-1778 | Sonar Algorithm Engineer |  |
| AC-1779 | Acoustic Sensor Engineer — Defense |  |
| AC-1780 | Hydrophone Array Engineer |  |
| AC-1781 | Underwater Communications Engineer |  |
| AC-1782 | Acoustic Countermeasures Engineer |  |
| AC-1783 | Sonar Test Engineer |  |
| AC-1784 | Sonar Test Technician |  |
| AC-1785 | Sonar Calibration Technician |  |
| AC-1786 | Acoustic Range Technician |  |
| AC-1787 | Underwater Acoustic Range Engineer |  |
| AC-1788 | Defense Acoustics Scientist |  |
| AC-1789 | Naval Bioacoustics Researcher |  |
| AC-1790 | Acoustic Intelligence Training Instructor |  |
| AC-1791 | Sonar Simulation Engineer |  |
| AC-1792 | Sonar Data Scientist |  |

### Hearing, Audiology, Psychoacoustics & Accessibility (43)
| ID | Title | Also called |
|---|---|---|
| AC-0558 | Audiologist | clinical audiologist |
| AC-0559 | Clinical Audiologist |  |
| AC-0560 | Pediatric Audiologist |  |
| AC-0561 | Educational Audiologist |  |
| AC-0562 | Geriatric Audiologist |  |
| AC-0563 | Cochlear-Implant Audiologist |  |
| AC-0564 | Vestibular Audiologist |  |
| AC-0565 | Tinnitus Specialist — Audiology |  |
| AC-0566 | Industrial Audiologist |  |
| AC-0567 | Hearing-Conservation Audiologist |  |
| AC-0568 | Research Audiologist |  |
| AC-0569 | Audiology Clinical Scientist |  |
| AC-0570 | Audiology Technician |  |
| AC-0571 | Audiometric Technician |  |
| AC-0572 | Hearing Instrument Specialist |  |
| AC-0573 | Hearing-Aid Specialist |  |
| AC-0574 | Hearing-Aid Fitting Specialist |  |
| AC-0575 | Cochlear-Implant Clinical Specialist |  |
| AC-0576 | Hearing-Device Verification Specialist |  |
| AC-0577 | Auditory Neuroscientist |  |
| AC-0578 | Auditory Perception Scientist |  |
| AC-0579 | Psychoacoustician |  |
| AC-0580 | Hearing Scientist |  |
| AC-0581 | Speech and Hearing Scientist |  |
| AC-0582 | Voice Perception Researcher |  |
| AC-0583 | Spatial-Hearing Researcher |  |
| AC-0584 | Listening-Test Engineer |  |
| AC-0585 | Critical-Listening Test Designer |  |
| AC-0586 | Human-Factors Audio Researcher |  |
| AC-0587 | Auditory UX Researcher |  |
| AC-0588 | Product Listening-Panel Coordinator |  |
| AC-0589 | Occupational Hearing-Conservationist |  |
| AC-0590 | Hearing-Safety Program Manager |  |
| AC-0591 | Audiology Equipment Specialist |  |
| AC-0592 | Assistive-Listening Technology Specialist |  |
| AC-0593 | Accessible Audio Consultant |  |
| AC-0594 | Audio Accessibility Engineer |  |
| AC-0595 | Accessible Media Audio Specialist |  |
| AC-0596 | Hearing-Loop Consultant |  |
| AC-0597 | Classroom Listening Systems Specialist |  |
| AC-0598 | Critical-Listening Instructor |  |
| AC-0599 | Ear-Training Instructor — Audio |  |
| AC-0600 | Hearing-Health Educator |  |

### Medical Ultrasound & Therapeutic Acoustics (24)
| ID | Title | Also called |
|---|---|---|
| AC-0601 | Diagnostic Medical Sonographer | ultrasound technologist · sonographer |
| AC-0602 | Cardiac Sonographer |  |
| AC-0603 | Vascular Sonographer |  |
| AC-0604 | Obstetric Sonographer |  |
| AC-0605 | Musculoskeletal Sonographer |  |
| AC-0606 | Neurosonographer |  |
| AC-0607 | Point-of-Care Ultrasound Specialist |  |
| AC-0608 | Ultrasound Applications Specialist |  |
| AC-0609 | Medical Ultrasound Physicist |  |
| AC-0610 | Ultrasound Imaging Scientist |  |
| AC-0611 | Medical Ultrasound Engineer |  |
| AC-0612 | Ultrasound Systems Engineer |  |
| AC-0613 | Ultrasound Transducer Engineer |  |
| AC-0614 | Biomedical Acoustics Engineer |  |
| AC-0615 | Therapeutic Ultrasound Researcher |  |
| AC-0616 | Focused-Ultrasound Engineer |  |
| AC-0617 | High-Intensity Focused Ultrasound Scientist |  |
| AC-0618 | Ultrasound Signal-Processing Engineer |  |
| AC-0619 | Ultrasound Beamforming Engineer |  |
| AC-0620 | Photoacoustic Imaging Engineer |  |
| AC-0621 | Medical Acoustic Imaging Researcher |  |
| AC-0622 | Ultrasound Equipment Service Engineer |  |
| AC-0623 | Ultrasound Calibration Specialist |  |
| AC-0624 | Clinical Ultrasound Research Coordinator |  |

### Audio Hardware, Transducers & Electronics Engineering (55)
| ID | Title | Also called |
|---|---|---|
| AC-0625 | Audio Hardware Engineer |  |
| AC-0626 | Audio Electronics Engineer |  |
| AC-0627 | Analog Audio Design Engineer |  |
| AC-0628 | Digital Audio Hardware Engineer |  |
| AC-0629 | Mixed-Signal Audio Engineer |  |
| AC-0630 | Audio Circuit Designer |  |
| AC-0631 | Audio PCB Design Engineer |  |
| AC-0632 | Audio Systems Engineer — Hardware |  |
| AC-0633 | Power Amplifier Design Engineer |  |
| AC-0634 | Microphone Design Engineer |  |
| AC-0635 | Microphone Transducer Engineer |  |
| AC-0636 | Loudspeaker Design Engineer |  |
| AC-0637 | Loudspeaker Transducer Engineer |  |
| AC-0638 | Compression-Driver Engineer |  |
| AC-0639 | Horn Design Engineer |  |
| AC-0640 | Loudspeaker Enclosure Engineer |  |
| AC-0641 | Crossover Design Engineer |  |
| AC-0642 | Headphone Acoustics Engineer |  |
| AC-0643 | Earphone Design Engineer |  |
| AC-0644 | Electroacoustic Engineer |  |
| AC-0645 | Transducer Engineer |  |
| AC-0646 | Motor-Structure Design Engineer |  |
| AC-0647 | Magnetics Engineer — Audio |  |
| AC-0648 | Transformer Design Engineer — Audio |  |
| AC-0649 | Power-Supply Engineer — Audio |  |
| AC-0650 | RF Audio Systems Engineer |  |
| AC-0651 | Wireless Audio Hardware Engineer |  |
| AC-0652 | Clocking and Synchronization Hardware Engineer |  |
| AC-0653 | FPGA Audio Engineer |  |
| AC-0654 | Embedded Hardware Engineer — Audio |  |
| AC-0655 | Audio Product Engineer |  |
| AC-0656 | Audio Product Development Engineer |  |
| AC-0657 | Audio Research and Development Engineer |  |
| AC-0658 | Acoustic Product Engineer |  |
| AC-0659 | Audio Measurement Engineer |  |
| AC-0660 | Audio Test Engineer |  |
| AC-0661 | Audio Validation Engineer |  |
| AC-0662 | Audio Reliability Engineer |  |
| AC-0663 | EMC/EMI Engineer — Audio Products |  |
| AC-0664 | Regulatory Compliance Engineer — Audio Products |  |
| AC-0665 | Audio Component Engineer |  |
| AC-0666 | Audio Applications Engineer — Hardware |  |
| AC-0667 | Audio Prototype Engineer |  |
| AC-0668 | Mechanical Engineer — Audio Products |  |
| AC-0669 | Industrial Designer — Audio Products |  |
| AC-0670 | Materials Engineer — Transducers |  |
| AC-0671 | Vacuum-Tube Audio Designer |  |
| AC-0672 | Analog Console Design Engineer |  |
| AC-0673 | Digital Console Systems Engineer |  |
| AC-0674 | Audio Interface Design Engineer |  |
| AC-0675 | Recorder Hardware Engineer |  |
| AC-0676 | Musical Electronics Engineer |  |
| AC-0677 | Effects-Pedal Design Engineer |  |
| AC-0678 | Synthesizer Hardware Engineer |  |
| AC-0679 | Hearing-Device Hardware Engineer |  |

### Audio Software, DSP, AI & Machine Learning (69)
| ID | Title | Also called |
|---|---|---|
| AC-0680 | Audio Software Engineer | audio developer · audio programmer |
| AC-0681 | Audio Application Developer |  |
| AC-0682 | Digital Signal Processing Engineer | DSP engineer · signal-processing engineer |
| AC-0683 | Audio DSP Engineer |  |
| AC-0684 | Audio Algorithm Engineer |  |
| AC-0685 | Real-Time Audio Systems Engineer |  |
| AC-0686 | Audio Plug-In Developer |  |
| AC-0687 | Virtual-Instrument Developer |  |
| AC-0688 | DAW Software Developer |  |
| AC-0689 | Audio Editor Software Developer |  |
| AC-0690 | Audio Middleware Developer |  |
| AC-0691 | Web Audio Developer |  |
| AC-0692 | Mobile Audio Developer |  |
| AC-0693 | Embedded Audio Software Engineer |  |
| AC-0694 | Audio Firmware Engineer |  |
| AC-0695 | Audio Driver Engineer |  |
| AC-0696 | Audio Codec Engineer |  |
| AC-0697 | Perceptual Audio Coding Engineer |  |
| AC-0698 | Streaming Audio Engineer — Software |  |
| AC-0699 | Low-Latency Media Engineer |  |
| AC-0700 | Audio Networking Software Engineer |  |
| AC-0701 | Spatial Audio Software Engineer |  |
| AC-0702 | Binaural Audio Algorithm Engineer |  |
| AC-0703 | Acoustic Echo-Cancellation Engineer |  |
| AC-0704 | Noise-Suppression Engineer |  |
| AC-0705 | Active Noise-Control Algorithm Engineer |  |
| AC-0706 | Beamforming Algorithm Engineer |  |
| AC-0707 | Dereverberation Algorithm Engineer |  |
| AC-0708 | Source-Separation Engineer |  |
| AC-0709 | Automatic Gain-Control Engineer |  |
| AC-0710 | Audio Quality Algorithm Engineer |  |
| AC-0711 | Music Information Retrieval Scientist |  |
| AC-0712 | MIR Engineer |  |
| AC-0713 | Audio Machine-Learning Engineer |  |
| AC-0714 | Machine-Learning Researcher — Audio |  |
| AC-0715 | Generative Audio Researcher |  |
| AC-0716 | Generative Music Engineer |  |
| AC-0717 | Text-to-Speech Engineer |  |
| AC-0718 | Speech-Synthesis Engineer |  |
| AC-0719 | Automatic Speech Recognition Engineer |  |
| AC-0720 | Speech-Processing Engineer |  |
| AC-0721 | Voice Conversion Researcher |  |
| AC-0722 | Voice Biometrics Engineer |  |
| AC-0723 | Acoustic Modeling Engineer — Speech |  |
| AC-0724 | Audio Classification Scientist |  |
| AC-0725 | Audio Event Detection Engineer |  |
| AC-0726 | Music Recommendation Audio Scientist |  |
| AC-0727 | Audio Search Engineer |  |
| AC-0728 | Audio Data Scientist |  |
| AC-0729 | Audio Data Engineer |  |
| AC-0730 | Audio Dataset Curator |  |
| AC-0731 | Audio Annotation Specialist |  |
| AC-0732 | Audio ML Data-Quality Specialist |  |
| AC-0733 | Audio Model Evaluator |  |
| AC-0734 | AI Audio Safety and Ethics Specialist |  |
| AC-0735 | Synthetic-Voice Policy Specialist |  |
| AC-0736 | Deepfake Audio Detection Engineer |  |
| AC-0737 | Audio Forensics ML Engineer |  |
| AC-0738 | Audio QA Automation Engineer |  |
| AC-0739 | Audio Software QA Engineer |  |
| AC-0740 | Plug-In QA Engineer |  |
| AC-0741 | Audio Build and Release Engineer |  |
| AC-0742 | Audio Developer Relations Engineer |  |
| AC-0743 | Audio SDK Engineer |  |
| AC-0744 | Audio API Product Engineer |  |
| AC-0745 | AI Audio Product Manager |  |
| AC-0746 | Conversational Audio UX Designer |  |
| AC-0747 | Voice User-Interface Sound Designer |  |
| AC-0748 | Generative Sound Designer |  |

### Manufacturing, Quality, Calibration & Repair (53)
| ID | Title | Also called |
|---|---|---|
| AC-0749 | Audio Equipment Repair Technician |  |
| AC-0750 | Professional Audio Service Technician |  |
| AC-0751 | Electronics Bench Technician — Audio |  |
| AC-0752 | Field-Service Technician — Audio |  |
| AC-0753 | Field-Service Engineer — Audio |  |
| AC-0754 | Warranty Repair Technician |  |
| AC-0755 | Studio Maintenance Engineer |  |
| AC-0756 | Broadcast Maintenance Technician |  |
| AC-0757 | Live Audio Maintenance Technician |  |
| AC-0758 | Console Repair Technician |  |
| AC-0759 | Analog Console Technician |  |
| AC-0760 | Digital Console Service Technician |  |
| AC-0761 | Microphone Repair Technician |  |
| AC-0762 | Loudspeaker Repair Technician |  |
| AC-0763 | Loudspeaker Recone Technician |  |
| AC-0764 | Amplifier Repair Technician |  |
| AC-0765 | Tube-Amplifier Technician |  |
| AC-0766 | Guitar-Amplifier Technician |  |
| AC-0767 | Effects-Pedal Repair Technician |  |
| AC-0768 | Synthesizer Repair Technician |  |
| AC-0769 | Electronic Musical-Instrument Technician |  |
| AC-0770 | Tape-Machine Technician |  |
| AC-0771 | Turntable Repair Technician |  |
| AC-0772 | Disc-Cutting Lathe Technician |  |
| AC-0773 | Headphone Repair Technician |  |
| AC-0774 | Audio Cable Fabrication Technician |  |
| AC-0775 | Cable-Assembly Technician |  |
| AC-0776 | Rack-Wiring Technician |  |
| AC-0777 | Soldering Technician — Audio |  |
| AC-0778 | Audio Production Assembler |  |
| AC-0779 | Electronics Manufacturing Technician |  |
| AC-0780 | Audio Manufacturing Technician |  |
| AC-0781 | Production Test Technician — Audio |  |
| AC-0782 | End-of-Line Audio Test Technician |  |
| AC-0783 | Audio Quality-Control Inspector |  |
| AC-0784 | Audio Quality Engineer |  |
| AC-0785 | Supplier Quality Engineer — Audio |  |
| AC-0786 | Manufacturing Engineer — Audio Products |  |
| AC-0787 | Manufacturing Supervisor — Audio Products |  |
| AC-0788 | Audio Production Planner |  |
| AC-0789 | Audio Calibration Technician |  |
| AC-0790 | Acoustic Calibration Technician |  |
| AC-0791 | Measurement Microphone Calibration Technician |  |
| AC-0792 | Audio Metrology Technician |  |
| AC-0793 | Failure-Analysis Engineer — Audio |  |
| AC-0794 | Reliability Test Technician — Audio |  |
| AC-0795 | Product Return Analysis Technician |  |
| AC-0796 | Audio Equipment Refurbishment Specialist |  |
| AC-0797 | Vintage Audio Restoration Technician |  |
| AC-0798 | Audio Reverse-Engineering Specialist |  |
| AC-0799 | Rental Equipment Prep Technician |  |
| AC-0800 | Backline Electronics Technician |  |
| AC-0801 | Technical Service Manager — Audio |  |

### Audio Archiving, Preservation & Restoration (35)
| ID | Title | Also called |
|---|---|---|
| AC-0802 | Audio Archivist | sound archivist · recorded-sound archivist |
| AC-0803 | Audiovisual Archivist |  |
| AC-0804 | Recorded-Sound Archivist |  |
| AC-0805 | Sound Collections Archivist |  |
| AC-0806 | Audio Archive Manager |  |
| AC-0807 | Music Label Archivist |  |
| AC-0808 | Museum Sound Archivist |  |
| AC-0809 | Field-Recording Archive Curator |  |
| AC-0810 | Oral-History Archivist |  |
| AC-0811 | Audio Preservation Engineer |  |
| AC-0812 | Audiovisual Preservation Engineer |  |
| AC-0813 | Audio Preservation Specialist |  |
| AC-0814 | Audio Digitization Technician |  |
| AC-0815 | Audio Transfer Engineer |  |
| AC-0816 | Archival Transfer Technician |  |
| AC-0817 | Analog Media Transfer Specialist |  |
| AC-0818 | Magnetic-Tape Transfer Engineer |  |
| AC-0819 | Magnetic-Tape Conservator |  |
| AC-0820 | Disc and Cylinder Transfer Engineer |  |
| AC-0821 | Vinyl and Lacquer Preservation Specialist |  |
| AC-0822 | Obsolete-Media Playback Specialist |  |
| AC-0823 | Audio Restoration Engineer |  |
| AC-0824 | Archival Audio Restoration Specialist |  |
| AC-0825 | Digital Audio Preservation Specialist |  |
| AC-0826 | Digital Preservation Archivist — AV |  |
| AC-0827 | Media Conservation Technician |  |
| AC-0828 | Audiovisual Conservator |  |
| AC-0829 | Audio Cataloging Librarian |  |
| AC-0830 | Recorded-Sound Cataloger |  |
| AC-0831 | Audio Metadata Librarian |  |
| AC-0832 | Archive Rights and Clearances Specialist |  |
| AC-0833 | Preservation Project Manager — Audio |  |
| AC-0834 | Archive Quality-Control Specialist |  |
| AC-0835 | Forensic Media Recovery Specialist |  |
| AC-0836 | Audio Migration Specialist |  |

### Forensic, Surveillance, Security & Public-Safety Audio (34)
| ID | Title | Also called |
|---|---|---|
| AC-0837 | Forensic Audio Examiner | forensic audio expert · audio forensic analyst |
| AC-0838 | Forensic Audio Analyst |  |
| AC-0839 | Forensic Audio Enhancement Specialist |  |
| AC-0840 | Audio Authentication Examiner |  |
| AC-0841 | Digital Media Forensics Examiner — Audio |  |
| AC-0842 | Forensic Voice Comparison Analyst |  |
| AC-0843 | Speaker Recognition Analyst |  |
| AC-0844 | Voice Biometrics Analyst |  |
| AC-0845 | Audio Evidence Technician |  |
| AC-0846 | Courtroom Audio Evidence Specialist |  |
| AC-0847 | Forensic Audio Expert Witness |  |
| AC-0848 | Gunshot Acoustics Analyst |  |
| AC-0849 | Acoustic Gunshot-Detection Engineer |  |
| AC-0850 | Acoustic Threat-Detection Engineer |  |
| AC-0851 | Drone Acoustic-Detection Engineer |  |
| AC-0852 | Security Audio Systems Engineer |  |
| AC-0853 | Acoustic Surveillance Engineer |  |
| AC-0854 | Surveillance Audio Technician |  |
| AC-0855 | Covert Audio Technician |  |
| AC-0856 | Counter-Surveillance Audio Specialist |  |
| AC-0857 | Technical Surveillance Countermeasures Specialist — Audio |  |
| AC-0858 | Lawful-Intercept Audio Specialist |  |
| AC-0859 | Intelligence Audio Analyst |  |
| AC-0860 | Defense Audio Intelligence Analyst |  |
| AC-0861 | Media Verification Analyst — Audio |  |
| AC-0862 | Deepfake Voice Detection Analyst |  |
| AC-0863 | Audio Redaction and Privacy Specialist |  |
| AC-0864 | Emergency Communications Audio Engineer |  |
| AC-0865 | Public-Safety Communications Audio Specialist |  |
| AC-0866 | Dispatch Recording Systems Administrator |  |
| AC-0867 | Body-Worn Camera Audio Specialist |  |
| AC-0868 | Interview-Room Recording Systems Specialist |  |
| AC-0869 | Courtroom Audio Systems Technician |  |
| AC-0870 | Legal Deposition Audio Technician |  |

### Technical Standards, Regulation, Law & Rights (41)
| ID | Title | Also called |
|---|---|---|
| AC-0871 | Audio Standards Engineer |  |
| AC-0872 | Audio Standards Specialist |  |
| AC-0873 | Standards Committee Technical Expert — Audio |  |
| AC-0874 | Audio Interoperability Engineer |  |
| AC-0875 | Media Metadata Standards Specialist |  |
| AC-0876 | Audio Coding Standards Engineer |  |
| AC-0877 | Immersive Audio Standards Engineer |  |
| AC-0878 | Broadcast Technical Standards Engineer |  |
| AC-0879 | Broadcast Compliance Specialist |  |
| AC-0880 | Broadcast Loudness Compliance Specialist |  |
| AC-0881 | RF Compliance Engineer |  |
| AC-0882 | Spectrum Management Specialist — Audio |  |
| AC-0883 | Frequency Coordinator |  |
| AC-0884 | FCC Compliance Consultant — Audio |  |
| AC-0885 | Product Safety Compliance Engineer — Audio |  |
| AC-0886 | EMC Compliance Specialist — Audio |  |
| AC-0887 | Occupational Noise Compliance Officer |  |
| AC-0888 | Environmental Noise Compliance Officer |  |
| AC-0889 | Sound Ordinance Enforcement Specialist |  |
| AC-0890 | Sound Law Consultant |  |
| AC-0891 | Acoustic Expert Witness |  |
| AC-0892 | Entertainment Attorney — Audio and Music |  |
| AC-0893 | Music Copyright Attorney |  |
| AC-0894 | Audio Technology Patent Attorney |  |
| AC-0895 | Audio Patent Agent |  |
| AC-0896 | Patent Examiner — Audio Technology |  |
| AC-0897 | Music Licensing Specialist |  |
| AC-0898 | Synchronization Licensing Specialist |  |
| AC-0899 | Mechanical Licensing Specialist |  |
| AC-0900 | Music Rights Clearance Specialist |  |
| AC-0901 | Audio Rights and Permissions Manager |  |
| AC-0902 | Music Publishing Administrator |  |
| AC-0903 | Royalty Analyst |  |
| AC-0904 | Performance Rights Administrator |  |
| AC-0905 | Neighboring Rights Specialist |  |
| AC-0906 | Music Metadata and Rights Specialist |  |
| AC-0907 | Digital Rights Management Specialist — Audio |  |
| AC-0908 | Voice-Data Privacy Specialist |  |
| AC-0909 | Synthetic-Media Compliance Specialist |  |
| AC-0910 | Accessible Audio Compliance Specialist |  |
| AC-0911 | Audio Policy Analyst |  |

### Education, Research, Training & Technical Communication (44)
| ID | Title | Also called |
|---|---|---|
| AC-0912 | Professor of Audio Engineering |  |
| AC-0913 | Professor of Acoustics |  |
| AC-0914 | Professor of Music Production |  |
| AC-0915 | Professor of Music Technology |  |
| AC-0916 | Recording Arts Instructor |  |
| AC-0917 | Live Sound Instructor |  |
| AC-0918 | Broadcast Engineering Instructor |  |
| AC-0919 | AV Technology Instructor |  |
| AC-0920 | Audio Electronics Instructor |  |
| AC-0921 | Audiology Educator |  |
| AC-0922 | Game Audio Instructor |  |
| AC-0923 | Post-Production Audio Instructor |  |
| AC-0924 | Adjunct Audio Instructor |  |
| AC-0925 | Audio Laboratory Manager — Education |  |
| AC-0926 | Recording Studio Manager — Education |  |
| AC-0927 | Academic Audio Technician |  |
| AC-0928 | School Audio Technology Coordinator |  |
| AC-0929 | Curriculum Developer — Audio |  |
| AC-0930 | Instructional Designer — Audio Education |  |
| AC-0931 | Online Audio Course Developer |  |
| AC-0932 | Audio Training Program Director |  |
| AC-0933 | Manufacturer Technical Trainer — Audio |  |
| AC-0934 | AV Technical Trainer |  |
| AC-0935 | Product Certification Trainer — Audio |  |
| AC-0936 | Audio Workshop Instructor |  |
| AC-0937 | Private Audio Mentor |  |
| AC-0938 | Critical Listening Coach |  |
| AC-0939 | Research Professor — Acoustics |  |
| AC-0940 | Postdoctoral Researcher — Acoustics |  |
| AC-0941 | Audio Research Engineer |  |
| AC-0942 | Acoustics Laboratory Technician |  |
| AC-0943 | Research Laboratory Manager — Audio |  |
| AC-0944 | Audio Education Researcher |  |
| AC-0945 | Certification Exam Developer — Audio |  |
| AC-0946 | Audio Textbook Author |  |
| AC-0947 | Audio Technical Writer |  |
| AC-0948 | Audio Documentation Writer |  |
| AC-0949 | Audio Standards Technical Editor |  |
| AC-0950 | Audio Journalist |  |
| AC-0951 | Audio Trade-Publication Editor |  |
| AC-0952 | Audio Educational Content Producer |  |
| AC-0953 | Museum Sound Educator |  |
| AC-0954 | Community Audio Education Coordinator |  |
| AC-0955 | STEM Acoustics Educator |  |

### Audio Business, Product, Sales & Operations (64)
| ID | Title | Also called |
|---|---|---|
| AC-0956 | Audio Company Founder |  |
| AC-0957 | Audio Entrepreneur |  |
| AC-0958 | Independent Audio Consultant |  |
| AC-0959 | Audio Business Consultant |  |
| AC-0960 | Studio Owner |  |
| AC-0961 | Studio Business Manager |  |
| AC-0962 | Studio Operations Manager |  |
| AC-0963 | Studio Booking Manager |  |
| AC-0964 | Audio Production Company Owner |  |
| AC-0965 | Audio Production Manager |  |
| AC-0966 | Audio Operations Manager |  |
| AC-0967 | Audio Project Manager |  |
| AC-0968 | Audio Program Manager |  |
| AC-0969 | Audio Project Coordinator |  |
| AC-0970 | Audio Production Coordinator |  |
| AC-0971 | Audio Crew Coordinator |  |
| AC-0972 | Audio Facility Manager |  |
| AC-0973 | Audio Rental Operations Manager |  |
| AC-0974 | Audio Equipment Fleet Manager |  |
| AC-0975 | Audio Product Manager |  |
| AC-0976 | Senior Audio Product Manager |  |
| AC-0977 | Audio Product Owner |  |
| AC-0978 | Audio Product Strategy Manager |  |
| AC-0979 | Audio Product Marketing Manager |  |
| AC-0980 | Technical Marketing Manager — Audio |  |
| AC-0981 | Audio Brand Manager |  |
| AC-0982 | Audio Product Specialist |  |
| AC-0983 | Audio Demonstration Specialist |  |
| AC-0984 | Audio Applications Specialist |  |
| AC-0985 | Audio Sales Engineer |  |
| AC-0986 | Pro Audio Sales Specialist |  |
| AC-0987 | Manufacturer Representative — Audio |  |
| AC-0988 | Audio Distribution Product Manager |  |
| AC-0989 | Audio Dealer Specialist |  |
| AC-0990 | Pro Audio Retail Specialist |  |
| AC-0991 | High-End Audio Sales Consultant |  |
| AC-0992 | Audio E-Commerce Manager |  |
| AC-0993 | Audio Customer Success Manager |  |
| AC-0994 | Audio Technical Support Specialist |  |
| AC-0995 | Audio Product Support Engineer |  |
| AC-0996 | Audio Customer Education Specialist |  |
| AC-0997 | Artist Relations Manager — Audio Brand |  |
| AC-0998 | Developer Relations Manager — Audio |  |
| AC-0999 | Audio Community Manager |  |
| AC-1000 | Audio Trade-Show Manager |  |
| AC-1001 | Audio Events Marketing Specialist |  |
| AC-1002 | Audio Content Marketing Specialist |  |
| AC-1003 | Audio Social-Media Producer |  |
| AC-1004 | Audio Product Reviewer |  |
| AC-1005 | Audio Content Creator |  |
| AC-1006 | Audio Podcast Network Manager |  |
| AC-1007 | Music A&R Representative |  |
| AC-1008 | A&R Administrator |  |
| AC-1009 | Music Supervisor |  |
| AC-1010 | Music Coordinator |  |
| AC-1011 | Music Clearance Coordinator |  |
| AC-1012 | Label Production Manager |  |
| AC-1013 | Music Publishing Operations Manager |  |
| AC-1014 | Audio Recruiter |  |
| AC-1015 | Audio Career Counselor |  |
| AC-1016 | Audio Grant Writer |  |
| AC-1017 | Audio Nonprofit Program Manager |  |
| AC-1018 | Audio Association Manager |  |
| AC-1019 | Audio Conference Producer |  |

### Consumer, Home, Vehicle & Personal Audio (41)
| ID | Title | Also called |
|---|---|---|
| AC-1020 | Car Audio Installer | mobile electronics installer · vehicle audio installer |
| AC-1021 | Car Audio Installation Technician |  |
| AC-1022 | Vehicle Audio Fabricator |  |
| AC-1023 | Car Audio System Designer |  |
| AC-1024 | Car Audio Tuning Specialist |  |
| AC-1025 | Mobile Electronics Technician |  |
| AC-1026 | OEM Vehicle Audio Systems Engineer |  |
| AC-1027 | Automotive Audio Engineer |  |
| AC-1028 | Automotive Acoustics Engineer |  |
| AC-1029 | Automotive NVH Engineer |  |
| AC-1030 | Vehicle Cabin Sound Engineer |  |
| AC-1031 | Active Road-Noise Cancellation Engineer |  |
| AC-1032 | Electric-Vehicle Exterior Sound Designer |  |
| AC-1033 | Automotive Sound-Quality Engineer |  |
| AC-1034 | Infotainment Audio Engineer |  |
| AC-1035 | Automotive Audio Validation Engineer |  |
| AC-1036 | Automotive Audio Test Technician |  |
| AC-1037 | Home Theater Designer |  |
| AC-1038 | Home Theater Installer |  |
| AC-1039 | Home Theater Calibration Specialist |  |
| AC-1040 | Residential Audio Integrator |  |
| AC-1041 | Whole-Home Audio Designer |  |
| AC-1042 | Smart-Home Audio Specialist |  |
| AC-1043 | Hi-Fi System Consultant |  |
| AC-1044 | High-End Audio Showroom Specialist |  |
| AC-1045 | Consumer Audio Product Tuner |  |
| AC-1046 | Loudspeaker Voicing Engineer |  |
| AC-1047 | Headphone Tuning Engineer |  |
| AC-1048 | Earbud Acoustics Engineer |  |
| AC-1049 | Personal Audio Product Specialist |  |
| AC-1050 | Smart-Speaker Acoustics Engineer |  |
| AC-1051 | Voice-Assistant Audio Engineer |  |
| AC-1052 | Mobile-Device Audio Engineer |  |
| AC-1053 | Laptop Audio Systems Engineer |  |
| AC-1054 | Telecommunications Audio Engineer |  |
| AC-1055 | Conference-Speakerphone Audio Engineer |  |
| AC-1056 | Wearable Audio Engineer |  |
| AC-1057 | Hearables Product Engineer |  |
| AC-1058 | Consumer Audio Test Engineer |  |
| AC-1059 | Consumer Audio Reviewer |  |
| AC-1060 | Audio Calibration Service Provider |  |

### DJ, Club & Event Performance Technology (25)
| ID | Title | Also called |
|---|---|---|
| AC-1061 | Club DJ |  |
| AC-1062 | Festival DJ |  |
| AC-1063 | Mobile DJ |  |
| AC-1064 | Wedding DJ |  |
| AC-1065 | Radio DJ |  |
| AC-1066 | Turntablist |  |
| AC-1067 | Scratch DJ |  |
| AC-1068 | Open-Format DJ |  |
| AC-1069 | Electronic Dance Music DJ |  |
| AC-1070 | DJ/Producer |  |
| AC-1071 | Remix DJ |  |
| AC-1072 | Livestream DJ |  |
| AC-1073 | DJ Technician |  |
| AC-1074 | DJ Equipment Technician |  |
| AC-1075 | DJ Stage Manager |  |
| AC-1076 | DJ Production Manager |  |
| AC-1077 | DJ Playback Technician |  |
| AC-1078 | Club Audio Technician |  |
| AC-1079 | Club Sound-System Manager |  |
| AC-1080 | Karaoke Host and Audio Operator |  |
| AC-1081 | Event Music Programmer |  |
| AC-1082 | Music Curator — Events |  |
| AC-1083 | Background-Music Programmer |  |
| AC-1084 | DJ Instructor |  |
| AC-1085 | DJ Equipment Product Specialist |  |

### Sonic Branding, UX, Exhibits & Experience Design (35)
| ID | Title | Also called |
|---|---|---|
| AC-1086 | Sonic Branding Strategist |  |
| AC-1087 | Sonic Brand Designer |  |
| AC-1088 | Audio Logo Composer |  |
| AC-1089 | Brand Sound Designer |  |
| AC-1090 | Product Sound Designer |  |
| AC-1091 | User-Interface Sound Designer |  |
| AC-1092 | Interaction Sound Designer |  |
| AC-1093 | Notification Sound Designer |  |
| AC-1094 | Alarm Sound Designer |  |
| AC-1095 | Auditory Display Designer |  |
| AC-1096 | Audio UX Designer |  |
| AC-1097 | Voice UX Designer |  |
| AC-1098 | Multisensory Experience Designer — Audio |  |
| AC-1099 | Immersive Installation Sound Designer |  |
| AC-1100 | Museum Experience Sound Designer |  |
| AC-1101 | Exhibition Audio Designer |  |
| AC-1102 | Public-Space Soundscape Designer |  |
| AC-1103 | Retail Experience Audio Designer |  |
| AC-1104 | Hospitality Soundscape Designer |  |
| AC-1105 | Theme-Park Sound Designer |  |
| AC-1106 | Themed-Entertainment Audio Designer |  |
| AC-1107 | Escape-Room Audio Designer |  |
| AC-1108 | Planetarium Audio Designer |  |
| AC-1109 | Digital Art Audio Designer |  |
| AC-1110 | Soundscape Composer |  |
| AC-1111 | Field Recordist |  |
| AC-1112 | Phonographer |  |
| AC-1113 | Nature Sound Recordist |  |
| AC-1114 | Urban Soundscape Researcher |  |
| AC-1115 | Acoustic Heritage Interpretation Designer |  |
| AC-1116 | Audio Walk Producer |  |
| AC-1117 | Binaural Experience Producer |  |
| AC-1118 | Immersive Documentary Audio Designer |  |
| AC-1119 | Meditation Audio Producer |  |
| AC-1120 | Wellness Audio Designer |  |

### Music for Picture, Scoring & Editorial (31)
| ID | Title | Also called |
|---|---|---|
| AC-1121 | Film Composer |  |
| AC-1122 | Television Composer |  |
| AC-1123 | Documentary Composer |  |
| AC-1124 | Animation Composer |  |
| AC-1125 | Trailer Composer |  |
| AC-1126 | Advertising Composer |  |
| AC-1127 | Production Music Composer |  |
| AC-1128 | Library Music Composer |  |
| AC-1129 | Additional Music Composer |  |
| AC-1130 | Score Arranger |  |
| AC-1131 | Score Orchestrator |  |
| AC-1132 | Film Music Copyist |  |
| AC-1133 | Scoring Music Preparation Specialist |  |
| AC-1134 | Music Editor — Scoring |  |
| AC-1135 | Supervising Music Editor |  |
| AC-1136 | Temp Music Editor |  |
| AC-1137 | Score Technical Engineer |  |
| AC-1138 | Scoring Pro Tools Operator |  |
| AC-1139 | Scoring Stage Recordist |  |
| AC-1140 | Scoring Stage Manager |  |
| AC-1141 | Orchestra Contractor |  |
| AC-1142 | Music Supervisor — Screen |  |
| AC-1143 | Music Coordinator — Screen |  |
| AC-1144 | Music Clearance Specialist — Screen |  |
| AC-1145 | Score Producer |  |
| AC-1146 | Soundtrack Album Producer |  |
| AC-1147 | Score Mixer |  |
| AC-1148 | Score Mastering Engineer |  |
| AC-1149 | Music Stem and Deliverables Engineer |  |
| AC-1150 | Synchronization Music Producer |  |
| AC-1151 | Music Cue-Sheet Specialist |  |

### Audio Networks, Cloud & Technical Infrastructure (29)
| ID | Title | Also called |
|---|---|---|
| AC-1152 | Audio Network Engineer |  |
| AC-1153 | Networked Audio Systems Engineer |  |
| AC-1154 | Dante Systems Engineer |  |
| AC-1155 | AES67 Network Engineer |  |
| AC-1156 | SMPTE ST 2110 Audio Engineer |  |
| AC-1157 | Media-over-IP Engineer |  |
| AC-1158 | Audio Network Architect |  |
| AC-1159 | Audio Network Administrator |  |
| AC-1160 | Audio Infrastructure Engineer |  |
| AC-1161 | Studio Infrastructure Engineer |  |
| AC-1162 | Broadcast IP Infrastructure Engineer |  |
| AC-1163 | Live Production Network Engineer |  |
| AC-1164 | Audio Clocking and Synchronization Specialist |  |
| AC-1165 | PTP Timing Engineer — Media |  |
| AC-1166 | Audio Redundancy and Resilience Engineer |  |
| AC-1167 | Audio Network Security Specialist |  |
| AC-1168 | Audio Systems Administrator |  |
| AC-1169 | Cloud Audio Infrastructure Engineer |  |
| AC-1170 | Cloud Media Engineer — Audio |  |
| AC-1171 | Remote Collaboration Audio Engineer |  |
| AC-1172 | Audio Streaming Infrastructure Engineer |  |
| AC-1173 | Content Delivery Audio Engineer |  |
| AC-1174 | Audio Platform Site-Reliability Engineer |  |
| AC-1175 | Audio Network Support Engineer |  |
| AC-1176 | Audio Network Commissioning Specialist |  |
| AC-1177 | Audio Network Test Engineer |  |
| AC-1178 | Media Systems Integration Engineer |  |
| AC-1179 | Audio Routing Systems Engineer |  |
| AC-1180 | Audio Control and Monitoring Engineer |  |

### Audio Measurement, System Tuning & Instrumentation (29)
| ID | Title | Also called |
|---|---|---|
| AC-1181 | Electroacoustic Measurement Engineer |  |
| AC-1182 | Acoustic Test and Measurement Engineer |  |
| AC-1183 | Audio Measurement Technician |  |
| AC-1184 | Electroacoustic Laboratory Technician |  |
| AC-1185 | Audio Analyzer Applications Specialist |  |
| AC-1186 | Audio Test-Instrument Product Specialist |  |
| AC-1187 | Audio Measurement Software Engineer |  |
| AC-1188 | Transfer-Function Measurement Specialist |  |
| AC-1189 | Sound-System Measurement Technician |  |
| AC-1190 | Sound-System Alignment Engineer |  |
| AC-1191 | Loudspeaker System Optimization Engineer |  |
| AC-1192 | Room Measurement Specialist |  |
| AC-1193 | Room Correction Systems Engineer |  |
| AC-1194 | Acoustic Calibration Engineer |  |
| AC-1195 | Measurement Microphone Specialist |  |
| AC-1196 | Audio Calibration Laboratory Manager |  |
| AC-1197 | Reference-Monitor Calibration Specialist |  |
| AC-1198 | Cinema Sound Calibration Technician |  |
| AC-1199 | Broadcast Monitor Calibration Engineer |  |
| AC-1200 | Listening-Room Calibration Specialist |  |
| AC-1201 | Audio Metrology Engineer |  |
| AC-1202 | Electroacoustic Standards Laboratory Engineer |  |
| AC-1203 | Acoustic Instrumentation Engineer |  |
| AC-1204 | Data-Acquisition Engineer — Acoustics |  |
| AC-1205 | Vibration Instrumentation Engineer |  |
| AC-1206 | Audio Benchmarking Engineer |  |
| AC-1207 | Audio Performance Verification Engineer |  |
| AC-1208 | Sound-Quality Evaluation Engineer |  |
| AC-1209 | Audio Measurement Consultant |  |

### Stagecraft, Rigging, Power & Production Support (36)
| ID | Title | Also called |
|---|---|---|
| AC-1210 | Entertainment Rigger |  |
| AC-1211 | Arena Rigger |  |
| AC-1212 | Theater Rigger |  |
| AC-1213 | Touring Rigger |  |
| AC-1214 | Rigging Supervisor |  |
| AC-1215 | Rigging Coordinator |  |
| AC-1216 | Motor Technician — Entertainment |  |
| AC-1217 | Hoist Technician |  |
| AC-1218 | Rigging Inspection Technician |  |
| AC-1219 | Stagehand |  |
| AC-1220 | Audio Stagehand |  |
| AC-1221 | Lead Stagehand |  |
| AC-1222 | Deck Audio Technician |  |
| AC-1223 | Production Carpenter — Audio Support |  |
| AC-1224 | Backline Technician |  |
| AC-1225 | Guitar Technician |  |
| AC-1226 | Keyboard Technician |  |
| AC-1227 | Drum Technician |  |
| AC-1228 | Orchestra Equipment Technician |  |
| AC-1229 | Stage Manager — Audio-Intensive Production |  |
| AC-1230 | Production Stage Manager |  |
| AC-1231 | Technical Production Manager |  |
| AC-1232 | Venue Operations Technician |  |
| AC-1233 | Loading-Dock Audio Coordinator |  |
| AC-1234 | Entertainment Electrician |  |
| AC-1235 | Touring Electrician |  |
| AC-1236 | Power Distribution Technician — Events |  |
| AC-1237 | Generator Technician — Events |  |
| AC-1238 | Temporary Power Supervisor |  |
| AC-1239 | Grounding and Bonding Specialist — Entertainment |  |
| AC-1240 | Electrical Safety Coordinator — Production |  |
| AC-1241 | Crowd and Site Audio Coordinator |  |
| AC-1242 | Festival Site Audio Coordinator |  |
| AC-1243 | Cable-Ramp and Floor-Routing Technician |  |
| AC-1244 | Production Communications Coordinator |  |
| AC-1245 | Production Safety Manager — Entertainment |  |

### Session Performance, Voice & Musical Direction (24)
| ID | Title | Also called |
|---|---|---|
| AC-1246 | Session Musician |  |
| AC-1247 | Studio Vocalist |  |
| AC-1248 | Session Singer |  |
| AC-1249 | Background Vocalist — Studio |  |
| AC-1250 | Voice Actor |  |
| AC-1251 | ADR Performer |  |
| AC-1252 | Loop Group Performer |  |
| AC-1253 | Foley Performer |  |
| AC-1254 | Studio Conductor |  |
| AC-1255 | Scoring-Stage Conductor |  |
| AC-1256 | Music Director — Recording |  |
| AC-1257 | Vocal Arranger |  |
| AC-1258 | Vocal Contractor |  |
| AC-1259 | Choir Contractor |  |
| AC-1260 | Session Band Leader |  |
| AC-1261 | Instrumental Coach — Recording |  |
| AC-1262 | Vocal Coach — Recording |  |
| AC-1263 | Dialect Coach — Voice Production |  |
| AC-1264 | Pronunciation Consultant — Recording |  |
| AC-1265 | Music Rehearsal Director |  |
| AC-1266 | Click-Track and Playback Conductor |  |
| AC-1267 | Remote Session Musician |  |
| AC-1268 | Sample-Library Performer |  |
| AC-1269 | Instrument Demonstrator — Audio Products |  |

### Music Performance, Conducting & Live Musical Direction (104)
| ID | Title | Also called |
|---|---|---|
| AC-1270 | Professional Musician |  |
| AC-1271 | Performing Musician |  |
| AC-1272 | Orchestral Musician |  |
| AC-1273 | Chamber Musician |  |
| AC-1274 | Pit Orchestra Musician |  |
| AC-1275 | Touring Musician |  |
| AC-1276 | Club Musician |  |
| AC-1277 | Cruise-Ship Musician |  |
| AC-1278 | Hotel Musician |  |
| AC-1279 | Resort Musician |  |
| AC-1280 | Wedding Musician |  |
| AC-1281 | Funeral Musician |  |
| AC-1282 | Ceremonial Musician |  |
| AC-1283 | Military Band Musician |  |
| AC-1284 | Church Musician |  |
| AC-1285 | Worship Musician |  |
| AC-1286 | Street Performer — Music |  |
| AC-1287 | Busker — Music |  |
| AC-1288 | Cover-Band Musician |  |
| AC-1289 | Tribute-Band Musician |  |
| AC-1290 | Solo Instrumentalist |  |
| AC-1291 | Concert Soloist |  |
| AC-1292 | Accompanist |  |
| AC-1293 | Collaborative Pianist |  |
| AC-1294 | Rehearsal Pianist |  |
| AC-1295 | Audition Pianist |  |
| AC-1296 | Dance-Class Accompanist |  |
| AC-1297 | Ballet Pianist |  |
| AC-1298 | Opera Repetiteur |  |
| AC-1299 | Vocal Repetiteur |  |
| AC-1300 | Piano Accompanist |  |
| AC-1301 | Organist |  |
| AC-1302 | Church Organist |  |
| AC-1303 | Theater Organist |  |
| AC-1304 | Harpsichordist |  |
| AC-1305 | Pianist |  |
| AC-1306 | Keyboardist |  |
| AC-1307 | Synthesizer Performer |  |
| AC-1308 | Guitarist |  |
| AC-1309 | Classical Guitarist |  |
| AC-1310 | Electric Guitarist |  |
| AC-1311 | Bass Guitarist |  |
| AC-1312 | Double Bassist |  |
| AC-1313 | Violinist |  |
| AC-1314 | Violist |  |
| AC-1315 | Cellist |  |
| AC-1316 | Harpist |  |
| AC-1317 | Flutist |  |
| AC-1318 | Clarinetist |  |
| AC-1319 | Oboist |  |
| AC-1320 | Bassoonist |  |
| AC-1321 | Saxophonist |  |
| AC-1322 | Trumpeter |  |
| AC-1323 | Trombonist |  |
| AC-1324 | French Horn Player |  |
| AC-1325 | Tuba Player |  |
| AC-1326 | Percussionist |  |
| AC-1327 | Orchestral Percussionist |  |
| AC-1328 | Drummer |  |
| AC-1329 | Session Drummer |  |
| AC-1330 | Mallet Percussionist |  |
| AC-1331 | Hand-Percussionist |  |
| AC-1332 | Vocalist |  |
| AC-1333 | Lead Vocalist |  |
| AC-1334 | Backing Vocalist |  |
| AC-1335 | Studio Singer |  |
| AC-1336 | Concert Singer |  |
| AC-1337 | Opera Singer |  |
| AC-1338 | Choral Singer |  |
| AC-1339 | Musical-Theater Singer |  |
| AC-1340 | Commercial Jingle Singer |  |
| AC-1341 | Demo Singer |  |
| AC-1342 | Choir Section Leader |  |
| AC-1343 | Cantor |  |
| AC-1344 | Vocal Ensemble Performer |  |
| AC-1345 | Beatboxer |  |
| AC-1346 | Live Looper |  |
| AC-1347 | Rapper |  |
| AC-1348 | Spoken-Word Performer |  |
| AC-1349 | Sound Poetry Performer |  |
| AC-1350 | Orchestra Conductor |  |
| AC-1351 | Symphony Conductor |  |
| AC-1352 | Choral Conductor |  |
| AC-1353 | Choir Director |  |
| AC-1354 | Chorus Master |  |
| AC-1355 | Band Conductor |  |
| AC-1356 | Concert Band Director |  |
| AC-1357 | Marching Band Director |  |
| AC-1358 | Opera Conductor |  |
| AC-1359 | Ballet Conductor |  |
| AC-1360 | Musical-Theater Music Director |  |
| AC-1361 | Music Director — Live Performance |  |
| AC-1362 | Music Director — Television |  |
| AC-1363 | Music Director — Cruise Entertainment |  |
| AC-1364 | Worship Music Director |  |
| AC-1365 | Bandleader |  |
| AC-1366 | Orchestra Leader |  |
| AC-1367 | Concertmaster |  |
| AC-1368 | Orchestra Section Leader |  |
| AC-1369 | Principal Orchestra Musician |  |
| AC-1370 | Vocal Music Director |  |
| AC-1371 | Music Rehearsal Pianist |  |
| AC-1372 | Audition Accompanist |  |
| AC-1373 | Music Ensemble Contractor |  |

### Musical Instrument Building, Tuning & Repair (89)
| ID | Title | Also called |
|---|---|---|
| AC-1374 | Musical Instrument Maker |  |
| AC-1375 | Musical Instrument Repair Technician |  |
| AC-1376 | Instrument Restoration Specialist |  |
| AC-1377 | Instrument Setup Technician |  |
| AC-1378 | Instrument Quality-Control Technician |  |
| AC-1379 | Instrument Final-Voicing Technician |  |
| AC-1380 | Instrument Intonation Specialist |  |
| AC-1381 | Instrument Customization Technician |  |
| AC-1382 | Luthier |  |
| AC-1383 | Guitar Maker |  |
| AC-1384 | Guitar Builder |  |
| AC-1385 | Guitar Repair Technician |  |
| AC-1386 | Guitar Setup Technician |  |
| AC-1387 | Guitar Finishing Specialist |  |
| AC-1388 | Guitar Pickup Installer |  |
| AC-1389 | Guitar Electronics Technician |  |
| AC-1390 | Guitar Fretwork Specialist |  |
| AC-1391 | Guitar Neck-Repair Specialist |  |
| AC-1392 | Bass Guitar Builder |  |
| AC-1393 | Bass Guitar Repair Technician |  |
| AC-1394 | Ukulele Maker |  |
| AC-1395 | Mandolin Maker |  |
| AC-1396 | Banjo Maker |  |
| AC-1397 | Fretted-Instrument Repair Technician |  |
| AC-1398 | Violin Maker |  |
| AC-1399 | Viola Maker |  |
| AC-1400 | Cello Maker |  |
| AC-1401 | Double-Bass Maker |  |
| AC-1402 | Violin Repairer |  |
| AC-1403 | String-Instrument Restorer |  |
| AC-1404 | Orchestral String-Instrument Technician |  |
| AC-1405 | Bow Maker |  |
| AC-1406 | Bow Repairer |  |
| AC-1407 | Bow Rehair Technician |  |
| AC-1408 | String-Instrument Setup Specialist |  |
| AC-1409 | String-Instrument Appraiser |  |
| AC-1410 | Piano Technician |  |
| AC-1411 | Registered Piano Technician |  |
| AC-1412 | Piano Tuner |  |
| AC-1413 | Concert Piano Technician |  |
| AC-1414 | Piano Rebuilder |  |
| AC-1415 | Piano Action Regulator |  |
| AC-1416 | Piano Voicing Technician |  |
| AC-1417 | Piano Refinishing Technician |  |
| AC-1418 | Piano Factory Technician |  |
| AC-1419 | Player-Piano Technician |  |
| AC-1420 | Digital Piano Technician |  |
| AC-1421 | Harpsichord Maker |  |
| AC-1422 | Harpsichord Technician |  |
| AC-1423 | Organ Builder |  |
| AC-1424 | Pipe-Organ Builder |  |
| AC-1425 | Pipe-Organ Voicer |  |
| AC-1426 | Pipe-Organ Tuner |  |
| AC-1427 | Pipe-Organ Technician |  |
| AC-1428 | Electronic Organ Technician |  |
| AC-1429 | Reed-Organ Restorer |  |
| AC-1430 | Accordion Repair Technician |  |
| AC-1431 | Harmonica Repair Technician |  |
| AC-1432 | Band Instrument Repair Technician |  |
| AC-1433 | Brass Instrument Repair Technician |  |
| AC-1434 | Woodwind Instrument Repair Technician |  |
| AC-1435 | Flute Repair Technician |  |
| AC-1436 | Clarinet Repair Technician |  |
| AC-1437 | Saxophone Repair Technician |  |
| AC-1438 | Oboe Repair Technician |  |
| AC-1439 | Bassoon Repair Technician |  |
| AC-1440 | Trumpet Repair Technician |  |
| AC-1441 | Trombone Repair Technician |  |
| AC-1442 | French Horn Repair Technician |  |
| AC-1443 | Tuba Repair Technician |  |
| AC-1444 | Brass-Instrument Dent Technician |  |
| AC-1445 | Woodwind Pad Technician |  |
| AC-1446 | Instrument Plating Technician |  |
| AC-1447 | Percussion Instrument Maker |  |
| AC-1448 | Drum Builder |  |
| AC-1449 | Drum Repair Technician |  |
| AC-1450 | Drum-Tuning Technician |  |
| AC-1451 | Cymbal Maker |  |
| AC-1452 | Mallet-Instrument Technician |  |
| AC-1453 | Timpani Technician |  |
| AC-1454 | Marimba Builder |  |
| AC-1455 | Harp Technician |  |
| AC-1456 | Harp Regulator |  |
| AC-1457 | Orchestra Instrument Technician |  |
| AC-1458 | School-District Instrument Repair Technician |  |
| AC-1459 | Touring Instrument Technician |  |
| AC-1460 | Museum Musical-Instrument Conservator |  |
| AC-1461 | Historic Musical-Instrument Restorer |  |
| AC-1462 | Vintage Keyboard Technician |  |

### Music Education, Lessons & Musicianship Coaching (60)
| ID | Title | Also called |
|---|---|---|
| AC-1463 | Music Teacher |  |
| AC-1464 | Elementary Music Teacher |  |
| AC-1465 | Secondary Music Teacher |  |
| AC-1466 | K–12 Music Educator |  |
| AC-1467 | General Music Teacher |  |
| AC-1468 | Instrumental Music Teacher |  |
| AC-1469 | Vocal Music Teacher |  |
| AC-1470 | Private Music Teacher |  |
| AC-1471 | Online Music Teacher |  |
| AC-1472 | Community Music Instructor |  |
| AC-1473 | Music Conservatory Instructor |  |
| AC-1474 | Music School Director |  |
| AC-1475 | Music Department Chair |  |
| AC-1476 | Professor of Music |  |
| AC-1477 | Adjunct Music Instructor |  |
| AC-1478 | Applied Music Professor |  |
| AC-1479 | Music Performance Professor |  |
| AC-1480 | Music Education Professor |  |
| AC-1481 | Music Theory Professor |  |
| AC-1482 | Aural Skills Instructor |  |
| AC-1483 | Ear-Training Instructor |  |
| AC-1484 | Sight-Singing Instructor |  |
| AC-1485 | Music Appreciation Instructor |  |
| AC-1486 | Music History Instructor |  |
| AC-1487 | Music Technology Teacher |  |
| AC-1488 | Electronic Music Instructor |  |
| AC-1489 | Songwriting Instructor |  |
| AC-1490 | Composition Teacher |  |
| AC-1491 | Orchestration Instructor |  |
| AC-1492 | Conducting Teacher |  |
| AC-1493 | Band Director |  |
| AC-1494 | Orchestra Director |  |
| AC-1495 | School Choir Director |  |
| AC-1496 | Jazz Ensemble Director |  |
| AC-1497 | Marching-Band Instructor |  |
| AC-1498 | Drumline Instructor |  |
| AC-1499 | Vocal Ensemble Director |  |
| AC-1500 | Youth Orchestra Conductor |  |
| AC-1501 | Community Choir Director |  |
| AC-1502 | Teaching Artist — Music |  |
| AC-1503 | Artist-in-Residence — Music |  |
| AC-1504 | Music Workshop Facilitator |  |
| AC-1505 | Instrumental Tutor |  |
| AC-1506 | Piano Teacher |  |
| AC-1507 | Guitar Teacher |  |
| AC-1508 | Drum Teacher |  |
| AC-1509 | String-Instrument Teacher |  |
| AC-1510 | Woodwind Teacher |  |
| AC-1511 | Brass Teacher |  |
| AC-1512 | Singing Teacher |  |
| AC-1513 | Voice Teacher |  |
| AC-1514 | Vocal Coach |  |
| AC-1515 | Choir Clinician |  |
| AC-1516 | Band Clinician |  |
| AC-1517 | Orchestra Clinician |  |
| AC-1518 | Music Adjudicator |  |
| AC-1519 | Music Competition Judge |  |
| AC-1520 | Audition Coach |  |
| AC-1521 | Performance Coach — Music |  |
| AC-1522 | Ensemble Coach |  |

### Music Therapy, Speech & Clinical Voice (44)
| ID | Title | Also called |
|---|---|---|
| AC-1523 | Music Therapist |  |
| AC-1524 | Board-Certified Music Therapist |  |
| AC-1525 | Neurologic Music Therapist |  |
| AC-1526 | Clinical Music Therapist |  |
| AC-1527 | Pediatric Music Therapist |  |
| AC-1528 | Geriatric Music Therapist |  |
| AC-1529 | Hospice Music Therapist |  |
| AC-1530 | Mental-Health Music Therapist |  |
| AC-1531 | Rehabilitation Music Therapist |  |
| AC-1532 | Medical Music Therapist |  |
| AC-1533 | School Music Therapist |  |
| AC-1534 | Community Music Therapist |  |
| AC-1535 | Music Therapy Program Director |  |
| AC-1536 | Music Therapy Clinical Supervisor |  |
| AC-1537 | Music Therapy Researcher |  |
| AC-1538 | Music Therapy Professor |  |
| AC-1539 | Music Therapy Internship Director |  |
| AC-1540 | Adaptive Music Specialist |  |
| AC-1541 | Therapeutic Music Practitioner |  |
| AC-1542 | Certified Music Practitioner |  |
| AC-1543 | Bedside Musician |  |
| AC-1544 | Healthcare Musician |  |
| AC-1545 | Speech-Language Pathologist |  |
| AC-1546 | Speech-Language Pathology Assistant |  |
| AC-1547 | Voice Therapist |  |
| AC-1548 | Clinical Voice Specialist |  |
| AC-1549 | Singing Voice Specialist |  |
| AC-1550 | Voice Rehabilitation Specialist |  |
| AC-1551 | Pediatric Speech-Language Pathologist |  |
| AC-1552 | Adult Speech-Language Pathologist |  |
| AC-1553 | Fluency Specialist |  |
| AC-1554 | Motor-Speech Disorders Specialist |  |
| AC-1555 | Accent Modification Specialist — Clinical |  |
| AC-1556 | Auditory-Verbal Therapist |  |
| AC-1557 | Listening and Spoken Language Specialist |  |
| AC-1558 | Cochlear-Implant Rehabilitation Specialist |  |
| AC-1559 | Aural Rehabilitation Specialist |  |
| AC-1560 | Hearing Rehabilitation Specialist |  |
| AC-1561 | Tinnitus Rehabilitation Specialist |  |
| AC-1562 | Hyperacusis Specialist |  |
| AC-1563 | Clinical Vocal-Fold Imaging Specialist |  |
| AC-1564 | Voice Clinic Coordinator |  |
| AC-1565 | Voice Research Scientist |  |
| AC-1566 | Communication Sciences Researcher |  |

### Phonetics, Linguistics & Speech Science (45)
| ID | Title | Also called |
|---|---|---|
| AC-1567 | Phonetician |  |
| AC-1568 | Acoustic Phonetician |  |
| AC-1569 | Experimental Phonetician |  |
| AC-1570 | Laboratory Phonologist |  |
| AC-1571 | Speech Scientist |  |
| AC-1572 | Speech Acoustics Researcher |  |
| AC-1573 | Speech Perception Researcher |  |
| AC-1574 | Voice Scientist |  |
| AC-1575 | Prosody Researcher |  |
| AC-1576 | Sociophonetician |  |
| AC-1577 | Clinical Phonetician |  |
| AC-1578 | Forensic Phonetician |  |
| AC-1579 | Forensic Speech Scientist |  |
| AC-1580 | Dialectologist |  |
| AC-1581 | Sociolinguist — Speech Variation |  |
| AC-1582 | Computational Linguist — Speech |  |
| AC-1583 | Speech Corpus Linguist |  |
| AC-1584 | Speech Data Linguist |  |
| AC-1585 | Pronunciation Lexicographer |  |
| AC-1586 | Pronunciation Dictionary Editor |  |
| AC-1587 | Text-to-Speech Linguist |  |
| AC-1588 | Automatic Speech Recognition Linguist |  |
| AC-1589 | Voice Assistant Linguist |  |
| AC-1590 | Conversational AI Linguist — Speech |  |
| AC-1591 | Speech Annotation Specialist |  |
| AC-1592 | Phonetic Transcription Specialist |  |
| AC-1593 | Speech Corpus Annotator |  |
| AC-1594 | Speech Data Curator |  |
| AC-1595 | Speech Dataset Quality Analyst |  |
| AC-1596 | Language Documentation Specialist — Audio |  |
| AC-1597 | Language Archive Audio Specialist |  |
| AC-1598 | Field Linguist — Audio Documentation |  |
| AC-1599 | Endangered-Language Recording Specialist |  |
| AC-1600 | Pronunciation Consultant |  |
| AC-1601 | Dialect Coach |  |
| AC-1602 | Accent Coach |  |
| AC-1603 | Singing Diction Coach |  |
| AC-1604 | Opera Diction Coach |  |
| AC-1605 | Dialogue Coach |  |
| AC-1606 | Phonetics Laboratory Manager |  |
| AC-1607 | Phonetics Laboratory Technician |  |
| AC-1608 | Articulatory Phonetics Researcher |  |
| AC-1609 | Speech Intelligibility Researcher |  |
| AC-1610 | Voice Biometrics Researcher |  |
| AC-1611 | Speaker Recognition Scientist |  |

### Telecom, Voice Quality & Communications Audio (43)
| ID | Title | Also called |
|---|---|---|
| AC-1612 | Voice Quality Engineer |  |
| AC-1613 | Telephony Audio Engineer |  |
| AC-1614 | VoIP Audio Engineer |  |
| AC-1615 | VoIP Quality Engineer |  |
| AC-1616 | Voice-over-IP Test Engineer |  |
| AC-1617 | Speech Quality Engineer |  |
| AC-1618 | Call-Quality Engineer |  |
| AC-1619 | Voice Quality Analyst |  |
| AC-1620 | Call-Quality Analyst |  |
| AC-1621 | Speech Intelligibility Engineer |  |
| AC-1622 | Telecom Acoustic Engineer |  |
| AC-1623 | Handset Audio Engineer |  |
| AC-1624 | Mobile Device Audio Engineer |  |
| AC-1625 | Smartphone Acoustic Engineer |  |
| AC-1626 | Telecom Codec Engineer |  |
| AC-1627 | Speech Codec Engineer |  |
| AC-1628 | Voice Compression Engineer |  |
| AC-1629 | Voice Signal-Processing Engineer |  |
| AC-1630 | Telecom Audio DSP Engineer |  |
| AC-1631 | Noise-Suppression Engineer — Communications |  |
| AC-1632 | Beamforming Engineer — Communications |  |
| AC-1633 | Microphone-Array Engineer — Communications |  |
| AC-1634 | Far-Field Voice Engineer |  |
| AC-1635 | Unified-Communications Audio Engineer |  |
| AC-1636 | Videoconferencing Audio Engineer |  |
| AC-1637 | Collaboration Audio Quality Engineer |  |
| AC-1638 | Contact-Center Audio Engineer |  |
| AC-1639 | Contact-Center Speech Analytics Specialist |  |
| AC-1640 | Interactive Voice Response Audio Designer |  |
| AC-1641 | IVR Voice Producer |  |
| AC-1642 | Telephony Prompt Producer |  |
| AC-1643 | Telephony Voice-User-Interface Designer |  |
| AC-1644 | Communications Audio Test Technician |  |
| AC-1645 | Headset Acoustics Engineer |  |
| AC-1646 | Headset Voice Quality Engineer |  |
| AC-1647 | Hearing-Aid Connectivity Engineer |  |
| AC-1648 | Radio Communications Audio Engineer |  |
| AC-1649 | Two-Way Radio Audio Technician |  |
| AC-1650 | Dispatch Communications Audio Technician |  |
| AC-1651 | Public-Safety Radio Audio Specialist |  |
| AC-1652 | Emergency Communications Recording Specialist |  |
| AC-1653 | Telecom Listening-Test Coordinator |  |
| AC-1654 | Voice Quality Benchmarking Specialist |  |

### Acoustic Construction & Noise-Control Trades (45)
| ID | Title | Also called |
|---|---|---|
| AC-1655 | Soundproofing Contractor |  |
| AC-1656 | Soundproofing Installer |  |
| AC-1657 | Acoustic Treatment Installer |  |
| AC-1658 | Acoustic Panel Installer |  |
| AC-1659 | Acoustic Ceiling Installer |  |
| AC-1660 | Acoustic Door Installer |  |
| AC-1661 | Acoustic Window Installer |  |
| AC-1662 | Noise-Barrier Installer |  |
| AC-1663 | Vibration-Isolation Installer |  |
| AC-1664 | Floating-Floor Installer |  |
| AC-1665 | Studio Construction Contractor |  |
| AC-1666 | Recording-Studio Builder |  |
| AC-1667 | Control-Room Builder |  |
| AC-1668 | Vocal-Booth Builder |  |
| AC-1669 | Isolation-Booth Installer |  |
| AC-1670 | Music Rehearsal-Room Builder |  |
| AC-1671 | Home-Theater Acoustic Installer |  |
| AC-1672 | Cinema Acoustic Installer |  |
| AC-1673 | Theater Acoustic Installation Technician |  |
| AC-1674 | Industrial Noise-Control Installer |  |
| AC-1675 | Machinery Enclosure Fabricator |  |
| AC-1676 | Acoustic Enclosure Installer |  |
| AC-1677 | Silencer Installation Technician |  |
| AC-1678 | Duct-Silencer Installer |  |
| AC-1679 | Vibration-Control Technician |  |
| AC-1680 | Acoustic Sealant Technician |  |
| AC-1681 | Sound-Isolation Field Technician |  |
| AC-1682 | Airborne Sound-Transmission Test Technician |  |
| AC-1683 | Impact Sound Test Technician |  |
| AC-1684 | Building Acoustics Test Technician |  |
| AC-1685 | Field Acoustics Technician |  |
| AC-1686 | Noise Survey Technician |  |
| AC-1687 | Occupational Noise Technician |  |
| AC-1688 | Hearing-Conservation Technician |  |
| AC-1689 | Noise Dosimetry Technician |  |
| AC-1690 | Sound-Level Monitoring Technician |  |
| AC-1691 | Construction Noise Monitor |  |
| AC-1692 | Community Noise Officer |  |
| AC-1693 | Environmental Noise Inspector |  |
| AC-1694 | Noise Code Enforcement Officer |  |
| AC-1695 | Airport Noise Monitor |  |
| AC-1696 | Noise-Control Product Specialist |  |
| AC-1697 | Acoustic Materials Sales Engineer |  |
| AC-1698 | Acoustic Product Estimator |  |
| AC-1699 | Acoustic Systems Project Manager |  |

### Music Curation, Repertoire, Libraries & Editorial (52)
| ID | Title | Also called |
|---|---|---|
| AC-1700 | Music Librarian |  |
| AC-1701 | Performance Librarian |  |
| AC-1702 | Orchestra Librarian |  |
| AC-1703 | Opera Librarian |  |
| AC-1704 | Choir Librarian |  |
| AC-1705 | Band Librarian |  |
| AC-1706 | Broadcast Music Librarian |  |
| AC-1707 | Production Music Librarian |  |
| AC-1708 | Recorded-Music Librarian |  |
| AC-1709 | Music Collections Librarian |  |
| AC-1710 | Music Cataloger |  |
| AC-1711 | Music Metadata Librarian |  |
| AC-1712 | Music Reference Librarian |  |
| AC-1713 | Digital Music Librarian |  |
| AC-1714 | Music Archive Curator |  |
| AC-1715 | Recorded-Sound Curator |  |
| AC-1716 | Music Museum Curator |  |
| AC-1717 | Music Repertoire Specialist |  |
| AC-1718 | Repertoire Analyst |  |
| AC-1719 | Repertoire Researcher |  |
| AC-1720 | A&R Representative |  |
| AC-1721 | A&R Manager |  |
| AC-1722 | A&R Director |  |
| AC-1723 | A&R Coordinator |  |
| AC-1724 | A&R Scout |  |
| AC-1725 | Artist Discovery Specialist |  |
| AC-1726 | Talent Scout — Music |  |
| AC-1727 | Label Repertoire Director |  |
| AC-1728 | Playlist Curator |  |
| AC-1729 | Editorial Playlist Curator |  |
| AC-1730 | Streaming Music Editor |  |
| AC-1731 | Music Programming Editor |  |
| AC-1732 | Radio Music Director |  |
| AC-1733 | Radio Program Director — Music |  |
| AC-1734 | Music Scheduler |  |
| AC-1735 | Music Programmer — Radio |  |
| AC-1736 | Music Programmer — Retail |  |
| AC-1737 | In-Store Music Curator |  |
| AC-1738 | Hospitality Music Curator |  |
| AC-1739 | Fitness Music Curator |  |
| AC-1740 | Assistant Music Supervisor |  |
| AC-1741 | Music Supervision Coordinator |  |
| AC-1742 | Production Music Catalog Manager |  |
| AC-1743 | Sync Catalog Specialist |  |
| AC-1744 | Music Metadata Editor |  |
| AC-1745 | Music Taxonomy Specialist |  |
| AC-1746 | Music Discovery Editor |  |
| AC-1747 | Music Content Reviewer |  |
| AC-1748 | Music Editorial Producer |  |
| AC-1749 | Album Reissue Producer |  |
| AC-1750 | Compilation Producer |  |
| AC-1751 | Catalog Development Manager — Music |  |

### Accessible Media & Audio Description (32)
| ID | Title | Also called |
|---|---|---|
| AC-1793 | Audio Describer |  |
| AC-1794 | Audio Description Writer |  |
| AC-1795 | Audio Description Scriptwriter |  |
| AC-1796 | Audio Description Editor |  |
| AC-1797 | Audio Description Script Editor |  |
| AC-1798 | Audio Description Director |  |
| AC-1799 | Audio Description Producer |  |
| AC-1800 | Audio Description Project Manager |  |
| AC-1801 | Audio Description Coordinator |  |
| AC-1802 | Audio Description Voice Talent |  |
| AC-1803 | Audio Description Editor — Post |  |
| AC-1804 | Audio Description Mastering Engineer |  |
| AC-1805 | Audio Description Quality-Control Specialist |  |
| AC-1806 | Audio Description Proof Listener |  |
| AC-1807 | Live Audio Describer |  |
| AC-1808 | Theater Audio Describer |  |
| AC-1809 | Museum Audio Describer |  |
| AC-1810 | Sports Audio Description Commentator |  |
| AC-1811 | Audio Descriptive Commentary Producer |  |
| AC-1812 | Audio Descriptive Commentary Mixer |  |
| AC-1813 | Accessible Media Audio Producer |  |
| AC-1814 | Accessible Media Audio Engineer |  |
| AC-1815 | Described-Video Specialist |  |
| AC-1816 | Talking-Book Producer |  |
| AC-1817 | Talking-Book Narrator |  |
| AC-1818 | Talking-Book Recording Engineer |  |
| AC-1819 | Talking-Book Quality-Control Specialist |  |
| AC-1820 | Assistive-Listening Coordinator |  |
| AC-1821 | Assistive-Listening Technician |  |
| AC-1822 | Hearing-Loop Technician |  |
| AC-1823 | Caption-and-Audio Accessibility QC Specialist |  |
| AC-1824 | Accessible Podcast Producer |  |

### Music Retail, Rental & Instrument Services (45)
| ID | Title | Also called |
|---|---|---|
| AC-1825 | Music Store Sales Associate |  |
| AC-1826 | Musical Instrument Sales Specialist |  |
| AC-1827 | Pro Audio Retail Sales Associate |  |
| AC-1828 | Studio Equipment Sales Specialist |  |
| AC-1829 | Live Sound Equipment Sales Specialist |  |
| AC-1830 | Keyboard Sales Specialist |  |
| AC-1831 | Guitar Sales Specialist |  |
| AC-1832 | Orchestral String Sales Specialist |  |
| AC-1833 | Band Instrument Sales Specialist |  |
| AC-1834 | Percussion Sales Specialist |  |
| AC-1835 | Piano Sales Specialist |  |
| AC-1836 | Organ Sales Specialist |  |
| AC-1837 | DJ Equipment Sales Specialist |  |
| AC-1838 | Headphone Sales Specialist |  |
| AC-1839 | Hi-Fi Sales Specialist |  |
| AC-1840 | Audio Product Demonstrator |  |
| AC-1841 | Musical Instrument Demonstrator |  |
| AC-1842 | Product Clinician — Musical Instruments |  |
| AC-1843 | Music Store Department Manager |  |
| AC-1844 | Music Store Manager |  |
| AC-1845 | Music Store Owner |  |
| AC-1846 | Pro Audio Store Manager |  |
| AC-1847 | Musical Instrument Buyer |  |
| AC-1848 | Pro Audio Equipment Buyer |  |
| AC-1849 | Vintage Audio Dealer |  |
| AC-1850 | Vintage Instrument Dealer |  |
| AC-1851 | Musical Instrument Appraiser |  |
| AC-1852 | Audio Equipment Appraiser |  |
| AC-1853 | Musical Instrument Auction Specialist |  |
| AC-1854 | Recorded-Music Auction Specialist |  |
| AC-1855 | Instrument Rental Technician |  |
| AC-1856 | Band Instrument Rental Coordinator |  |
| AC-1857 | Orchestra Instrument Rental Coordinator |  |
| AC-1858 | Piano Rental Technician |  |
| AC-1859 | Backline Rental Technician |  |
| AC-1860 | Backline Rental Coordinator |  |
| AC-1861 | Pro Audio Rental Coordinator |  |
| AC-1862 | Music Equipment Inventory Specialist |  |
| AC-1863 | Instrument Fleet Manager |  |
| AC-1864 | School Instrument Asset Manager |  |
| AC-1865 | Touring Backline Coordinator |  |
| AC-1866 | Music Products Manufacturer Representative |  |
| AC-1867 | Pro Audio Manufacturer Representative |  |
| AC-1868 | Music Products Territory Manager |  |
| AC-1869 | Audio Distributor Product Specialist |  |

### Field Recording, Sound Libraries & Sonic Heritage (33)
| ID | Title | Also called |
|---|---|---|
| AC-1870 | Wildlife Sound Recordist |  |
| AC-1871 | Urban Soundscape Recordist |  |
| AC-1872 | Ambience Recordist |  |
| AC-1873 | Production Sound-Effects Recordist |  |
| AC-1874 | Foley Library Recordist |  |
| AC-1875 | Vehicle Sound Recordist |  |
| AC-1876 | Weapons Sound Recordist |  |
| AC-1877 | Machinery Sound Recordist |  |
| AC-1878 | Sound Library Producer |  |
| AC-1879 | Sound Library Editor |  |
| AC-1880 | Sound Library Curator |  |
| AC-1881 | Sound Library Metadata Specialist |  |
| AC-1882 | Sound Library Licensing Manager |  |
| AC-1883 | Production Music Library Audio Specialist |  |
| AC-1884 | Audio Asset Librarian |  |
| AC-1885 | Audio Asset Manager |  |
| AC-1886 | Sound-Effects Cataloger |  |
| AC-1887 | Audio Metadata Cataloger |  |
| AC-1888 | Acoustic Ecology Field Researcher |  |
| AC-1889 | Soundscape Researcher |  |
| AC-1890 | Soundscape Documentarian |  |
| AC-1891 | Soundwalk Designer |  |
| AC-1892 | Sonic Heritage Specialist |  |
| AC-1893 | Cultural Sound Archivist |  |
| AC-1894 | Oral-Tradition Recordist |  |
| AC-1895 | Ethnomusicology Field Recordist |  |
| AC-1896 | Museum Sound Collections Specialist |  |
| AC-1897 | Historical Soundscape Researcher |  |
| AC-1898 | Natural Sound Archive Technician |  |
| AC-1899 | Bioacoustic Data Curator |  |
| AC-1900 | Passive Acoustic Monitoring Field Technician |  |
| AC-1901 | Field Recording Expedition Leader |  |
| AC-1902 | Location Audio Logistics Coordinator |  |
