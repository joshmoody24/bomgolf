import json

#Takes the raw text file and creates a dictionary of verses
def convertRawTextToVerses():
    bom = open("bom-mod.txt")

    verses = {}

    lines = bom.readlines()

    #ditch the weird garbage line at the top
    lines.pop(0)
    #purge all blank lines and lines with "Chapter" in them (redundant)
    for line in lines:
        if line == '\n':
            lines.remove(line)
        elif "Chapter" in line:
            lines.remove(line)

    book = '1 Nephi'
    chapter = 1
    verse = 1

    #process loop that iterates over every chapter of the Book of Mormon
    while(len(lines) > 0):  
        #will be something like ['1', 'Nephi', '3'] or ['Alma', '7']
        chapterheading = lines.pop(0).strip().split()
        if(len(chapterheading) == 2):
            book = chapterheading[0]
            #special case for Words of Mormon, which is abbreviated "WOM" in the text file
            if(book == 'WOM'):
                book = "Words of Mormon"
            chapter = int(chapterheading[1])
        elif(len(chapterheading) == 3):
            book = chapterheading[0] + ' ' + chapterheading[1]
            chapter = int(chapterheading[2])
        else:
            print("ERROR: chapter heading not formatted correctly")               
            verse_string = lines.pop(0).strip()
            verse = int(verse_string.split(':')[1])      

        isNewChapter = False
        #processes entire chapter by procesing verses until reaching a line that has a number at the end but no semicolon
        while(not isNewChapter):
            #get rid of the reference line
            lines.pop(0)
            #processes entire verse by concatenting all lines until another verse is discovered
            #discovers new verse by detecting whether string contains a number
            #this while condition only returns true on lines that denote a new verse
            versetext = ""
            isNewVerse = False
            isNewChapter = False
            
            while(not isNewVerse):
                if(len(lines) == 0):
                    break
                versetext += lines.pop(0).strip() + ' '               
                try:
                    #if new verse
                    if(lines[0].strip().split(':')[1].isdigit()):
                        isNewVerse = True
                except:
                    isNewVerse = False
                #garbage code but I promise it works. Special case for words of mormon
                #if new chapter
                try:
                    if(lines[0].strip().split()[1].isdigit() or lines[0].strip().split()[2].isdigit()):
                        isNewChapter = True
                        isNewVerse = True
                except:
                    isNewChapter = False
            #verse is finished, add it to the dictionary
            verses[str(book) + ' ' + str(chapter) + ':' + str(verse)] = versetext.strip()

            if(len(lines) == 0):
                break

            if(not isNewChapter):
                verse = int(lines[0].strip().split(':')[-1]) 
            else:
                verse = 1

    bom.close()
    return verses


print("Reading Book of Mormon data....")
bom = convertRawTextToVerses()
print("BOM read complete")

print("saving to file...")
with open('bomdata.json', 'w') as fp:
   json.dump(bom,fp,indent=4)