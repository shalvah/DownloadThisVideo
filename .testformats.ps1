sls invoke local -f startTwitterSignIn -d '{\"queryStringParameters\":{\"username\":\"theshalvah\", \"fbtoken\":\"adfs\"}}'

sls invoke local -f completeTwitterSignIn -d '{\"queryStringParameters\":{\"username\":\"theshalvah\", \"fbtoken\":\"adfs\",\"oauth_token\":\"BOGCZwAAAAAA6eRZAAABblDz_mE\",\"oauth_verifier\":\"2MArceRT5O5qmx7uaqSlOhSRCzjjRJHF\"}}'