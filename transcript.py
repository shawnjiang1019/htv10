import sys
from youtube_transcript_api import YouTubeTranscriptApi

def get_transcript(video_id, languages=['en']):
    print(f'Getting transcript for id ${video_id}')
    ytt_api = YouTubeTranscriptApi()
    transcript_obj = ytt_api.fetch(video_id, languages=languages)
    print(f'Transcript acquired for id ${video_id}')

    def get_raw_text(transcript_obj):
        return ' '.join([snippet['text'] for snippet in transcript_obj.to_raw_data()])

    transcript_obj.raw_text = get_raw_text(transcript_obj)
    print(f'Converted to raw text: added to attribute .raw_text')

    return transcript_obj

if __name__ == '__main__':
    id = 'eJENP0Rr8p0'
    if len(sys.argv) > 1:
        id = sys.argv[1]
    z = get_transcript(id)
    print(z.raw_text)