import gensim.downloader as api
import numpy as np
from scipy.spatial.distance import cosine

class Word2VecSentimentScorer:
    """Score sentences for positive/negative sentiment using Word2Vec"""
    
    def __init__(self, model_name='glove-twitter-25'):
        """
        Initialize with pretrained Word2Vec model
        Options: 'word2vec-google-news-300', 'glove-twitter-25', 'glove-wiki-gigaword-300'
        """
        print(f"Loading pretrained model: {model_name}...")
        self.model = api.load(model_name)
        print("Model loaded successfully!")
        
        # Positive tone (hopeful, constructive, favorable)
        positive_seeds = [
            'progress', 'success', 'achievement', 'breakthrough', 'growth',
            'improvement', 'recovery', 'gained', 'strengthened', 'resolved',
            'agreement', 'cooperation', 'advance', 'victory', 'boost',
            'prosperity', 'thriving', 'flourishing', 'positive', 'optimistic',
            'celebrated', 'praised', 'accomplished', 'triumph', 'innovative'
        ]

        # Negative tone (concerning, critical, problematic)
        negative_seeds = [
            'crisis', 'conflict', 'failure', 'decline', 'controversy',
            'scandal', 'corruption', 'violence', 'threat', 'collapsed',
            'criticized', 'condemned', 'struggling', 'deteriorating', 'loss',
            'disaster', 'emergency', 'chaos', 'turmoil', 'tension',
            'alarming', 'devastating', 'tragic', 'setback', 'disruption'
        ]
        # Define seed words for positive and negative sentiment
        self.positive_seeds = positive_seeds
        self.negative_seeds = negative_seeds
        
        # Calculate average positive and negative vectors
        self.positive_vector = self._average_seed_vector(self.positive_seeds)
        self.negative_vector = self._average_seed_vector(self.negative_seeds)
    
    def _average_seed_vector(self, seeds):
        """Calculate average vector from seed words"""
        vectors = []
        for word in seeds:
            if word in self.model:
                vectors.append(self.model[word])
        return np.mean(vectors, axis=0) if vectors else np.zeros(self.model.vector_size)
    
    def _get_sentence_vector(self, sentence):
        """Convert sentence to vector by averaging word vectors"""
        words = sentence.lower().split()
        vectors = [self.model[word] for word in words if word in self.model]
        
        if not vectors:
            return np.zeros(self.model.vector_size)
        
        return np.mean(vectors, axis=0)
    
    def score_similarity(self, sentence):
        """
        Score based on similarity to positive/negative seed words
        Returns: score from -1 (negative) to +1 (positive)
        """
        sentence_vec = self._get_sentence_vector(sentence)
        
        # Calculate cosine similarity to positive and negative vectors
        pos_similarity = 1 - cosine(sentence_vec, self.positive_vector)
        neg_similarity = 1 - cosine(sentence_vec, self.negative_vector)
        
        # Normalize to -1 to +1 scale
        score = (pos_similarity - neg_similarity) / (pos_similarity + neg_similarity + 1e-8)
        
        return score
    
    def score_projection(self, sentence):
        """
        Score based on projection onto positive-negative axis
        Returns: score from -1 (negative) to +1 (positive)
        """
        sentence_vec = self._get_sentence_vector(sentence)
        
        # Create sentiment axis (positive - negative)
        sentiment_axis = self.positive_vector - self.negative_vector
        sentiment_axis = sentiment_axis / (np.linalg.norm(sentiment_axis) + 1e-8)
        
        # Project sentence vector onto sentiment axis
        projection = np.dot(sentence_vec, sentiment_axis)
        
        # Normalize to -1 to +1 range (approximate)
        score = np.tanh(projection)
        
        return score
    
    def score_individual_words(self, sentence):
        """
        Score by averaging individual word similarities
        Returns: score from -1 (negative) to +1 (positive)
        """
        words = sentence.lower().split()
        word_scores = []
        
        for word in words:
            if word in self.model:
                pos_sim = 1 - cosine(self.model[word], self.positive_vector)
                neg_sim = 1 - cosine(self.model[word], self.negative_vector)
                word_score = (pos_sim - neg_sim) / (pos_sim + neg_sim + 1e-8)
                word_scores.append(word_score)
        
        return np.mean(word_scores) if word_scores else 0.0
    
    def score_weighted(self, sentence):
        """
        Weighted combination of all methods
        Returns: score from -1 (negative) to +1 (positive)
        """
        similarity_score = self.score_similarity(sentence)
        projection_score = self.score_projection(sentence)
        word_score = self.score_individual_words(sentence)
        
        # Weighted average (you can adjust weights)
        final_score = (0.4 * similarity_score + 
                      0.3 * projection_score + 
                      0.3 * word_score)
        
        return final_score
    
    def analyze(self, sentence, method='weighted'):
        """
        Analyze a sentence and return detailed results
        
        Args:
            sentence: Input text to analyze
            method: 'similarity', 'projection', 'individual', or 'weighted'
        
        Returns:
            dict with score, sentiment label, and confidence
        """
        if method == 'similarity':
            score = self.score_similarity(sentence)
        elif method == 'projection':
            score = self.score_projection(sentence)
        elif method == 'individual':
            score = self.score_individual_words(sentence)
        else:  # weighted
            score = self.score_weighted(sentence)
        
        # Determine sentiment label
        if score > 0.2:
            sentiment = "POSITIVE"
        elif score < -0.2:
            sentiment = "NEGATIVE"
        else:
            sentiment = "NEUTRAL"
        
        confidence = abs(score)
        
        return {
            'sentence': sentence,
            'score': round(score, 4),
            'sentiment': sentiment,
            'confidence': round(confidence, 4)
        }
    
    def batch_analyze(self, sentences, method='weighted'):
        """Analyze multiple sentences"""
        results = []
        for sentence in sentences:
            results.append(self.analyze(sentence, method))
        return results


# Example usage
if __name__ == "__main__":
    # Initialize scorer
    scorer = Word2VecSentimentScorer()
    
    # Test sentences
    test_sentences = [
        "I love this movie it's absolutely amazing",
        "This is terrible and disappointing",
        "The product is okay nothing special",
        "Fantastic experience highly recommend",
        "Worst purchase ever complete waste of money",
        "Great quality and fast shipping",
        "Not bad but could be better",
        "Absolutely horrible customer service",
        "Perfect exactly what I needed",
        "The food was decent"
    ]
    
    print("\n" + "="*80)
    print("SENTIMENT ANALYSIS RESULTS")
    print("="*80)
    
    # Analyze each sentence
    for sentence in test_sentences:
        result = scorer.analyze(sentence, method='weighted')
        
        # Format output
        score_bar = "+" * int(result['score'] * 20) if result['score'] > 0 else "-" * int(abs(result['score']) * 20)
        
        print(f"\nText: {result['sentence']}")
        print(f"Score: {result['score']:+.4f} [{score_bar}]")
        print(f"Sentiment: {result['sentiment']} (confidence: {result['confidence']:.4f})")
    
    print("\n" + "="*80)
    
    # Compare different methods
    print("\nMETHOD COMPARISON:")
    print("="*80)
    test_text = "This movie is absolutely wonderful"
    
    methods = ['similarity', 'projection', 'individual', 'weighted']
    for method in methods:
        result = scorer.analyze(test_text, method=method)
        print(f"{method.upper():12s}: {result['score']:+.4f} -> {result['sentiment']}")