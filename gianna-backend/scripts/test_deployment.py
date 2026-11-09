import importlib
import os
import unittest
from unittest.mock import patch

from flask import Flask, jsonify, request

from backend.app.deployment import configure_deployment
from backend.app.ollama_connection import base_url, chat_headers


class DeploymentTests(unittest.TestCase):
    def setUp(self):
        self.environment = patch.dict(os.environ, {
            'FLASK_ENV': 'production',
            'CORS_ORIGINS': 'https://turismo.example,https://www.turismo.example',
            'OLLAMA_HOST': 'https://ollama.com',
            'OLLAMA_API_KEY': 'deployment-test-placeholder',
        })
        self.environment.start()
        self.addCleanup(self.environment.stop)

    def app(self):
        app = Flask(__name__)
        configure_deployment(app)

        @app.post('/api/ask-text')
        def ask():
            request.get_json()
            return jsonify(answer='Test contract', generation_id='test')

        @app.get('/api/ready')
        def ready():
            return jsonify(status='ready')

        @app.get('/api/debug/last-turn')
        def private():
            return jsonify(secret='Must not be public')

        return app

    def test_preflight_and_actual_request(self):
        client = self.app().test_client()
        for origin in ('https://turismo.example', 'https://www.turismo.example'):
            response = client.options('/api/ask-text', headers={
                'Origin': origin,
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'content-type',
            })
            self.assertEqual(response.status_code, 204)
            self.assertEqual(response.headers['Access-Control-Allow-Origin'], origin)
            self.assertEqual(response.headers['Access-Control-Allow-Methods'], 'POST')
            self.assertNotIn('Access-Control-Allow-Credentials', response.headers)
            self.assertIn('Origin', response.headers['Vary'])
            response = client.post('/api/ask-text', json={'question': 'Hola'}, headers={'Origin': origin})
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.headers['Access-Control-Allow-Origin'], origin)
            self.assertEqual(response.headers['Cache-Control'], 'no-store')

    def test_untrusted_origins_and_methods(self):
        client = self.app().test_client()
        for origin in ('https://evil.example', 'null', 'https://turismo.example.evil.example'):
            response = client.post('/api/ask-text', json={}, headers={'Origin': origin})
            self.assertEqual(response.status_code, 403)
            self.assertNotIn('Access-Control-Allow-Origin', response.headers)
        response = client.options('/api/ask-text', headers={
            'Origin': 'https://turismo.example', 'Access-Control-Request-Method': 'DELETE',
        })
        self.assertEqual(response.status_code, 403)
        response = client.options('/api/ready', headers={
            'Origin': 'https://turismo.example', 'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'authorization',
        })
        self.assertEqual(response.status_code, 403)

    def test_health_private_routes_and_payload_limit(self):
        client = self.app().test_client()
        self.assertEqual(client.get('/api/ready').status_code, 200)
        self.assertEqual(client.get('/api/debug/last-turn').status_code, 404)
        self.assertEqual(client.get('/api/diagnostics').status_code, 404)
        self.assertEqual(client.get('/api/web/search').status_code, 404)
        self.assertEqual(client.post('/api/ask-text', json={'question': 'x' * 32768}).status_code, 413)
        response = client.post('/api/ask-text', data='invalid', content_type='application/json',
                               headers={'Origin': 'https://turismo.example'})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.headers['Access-Control-Allow-Origin'], 'https://turismo.example')

    def test_invalid_production_configuration_fails_startup(self):
        for origin in ('*', 'http://turismo.example', 'https://turismo.example/', 'https://turismo.example/api',
                       'https://user:password@turismo.example', 'https://turismo.example?token=x'):
            with self.subTest(origin=origin), patch.dict(os.environ, {'CORS_ORIGINS': origin}):
                with self.assertRaises(ValueError):
                    self.app()
        for host in ('https://ollama.com/api', 'http://remote.example', 'https://user:password@ollama.com'):
            with self.subTest(host=host), patch.dict(os.environ, {'OLLAMA_HOST': host}):
                with self.assertRaises(ValueError):
                    self.app()
        with patch.dict(os.environ, {'OLLAMA_API_KEY': ''}):
            with self.assertRaises(ValueError):
                self.app()
        with patch.dict(os.environ, {'FLASK_ENV': 'invalid'}):
            with self.assertRaises(ValueError):
                self.app()

    def test_local_development_and_legacy_host(self):
        with patch.dict(os.environ, {'FLASK_ENV': 'development', 'OLLAMA_HOST': 'http://127.0.0.1:11434',
                                    'OLLAMA_API_KEY': '', 'CORS_ORIGINS': 'http://localhost:4322'}):
            client = self.app().test_client()
            self.assertEqual(client.get('/api/debug/last-turn').status_code, 200)
            self.assertEqual(client.get('/api/ready', headers={'Origin': 'http://localhost:4322'}).status_code, 200)
        with patch.dict(os.environ, {'OLLAMA_HOST': '', 'OLLAMA_BASE_URL': 'http://127.0.0.1:11434'}):
            self.assertEqual(base_url(), 'http://127.0.0.1:11434')
        self.assertEqual(chat_headers()['Authorization'], 'Bearer deployment-test-placeholder')

    def test_model_configuration_applies_to_all_generation_paths(self):
        from backend.app import runtime_config
        try:
            with patch.dict(os.environ, {'OLLAMA_MODEL': 'mistral-large-4'}):
                config = importlib.reload(runtime_config).CONFIG
                for key in ('router_model', 'answer_model', 'fallback_model'):
                    self.assertEqual(config[key], 'mistral-large-4')
            for model in ('', 'bad model', 'x' * 201):
                with patch.dict(os.environ, {'OLLAMA_MODEL': model}), self.assertRaises(ValueError):
                    importlib.reload(runtime_config)
        finally:
            importlib.reload(runtime_config)


if __name__ == '__main__':
    unittest.main()
