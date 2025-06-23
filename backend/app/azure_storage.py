import os
from azure.storage.blob import BlobServiceClient
from typing import Optional
import asyncio

class AzureVideoStorage:
    def __init__(self, connection_string: str, container_name: str):
        self.blob_service_client = BlobServiceClient.from_connection_string(connection_string)
        self.container_name = container_name
    
    async def get_video_url(self, video_id: str) -> str:
        """Get a SAS URL for video streaming"""
        blob_client = self.blob_service_client.get_blob_client(
            container=self.container_name,
            blob=f"{video_id}.mp4"
        )
        
        # Generate SAS token for secure access
        from datetime import datetime, timedelta
        from azure.storage.blob import generate_blob_sas, BlobSasPermissions
        
        sas_token = generate_blob_sas(
            account_name=self.blob_service_client.account_name,
            container_name=self.container_name,
            blob_name=f"{video_id}.mp4",
            permission=BlobSasPermissions(read=True),
            expiry=datetime.utcnow() + timedelta(hours=1)
        )
        
        return f"{blob_client.url}?{sas_token}"
    
    async def upload_video(self, video_id: str, video_data: bytes):
        """Upload video to Azure Blob Storage"""
        blob_client = self.blob_service_client.get_blob_client(
            container=self.container_name,
            blob=f"{video_id}.mp4"
        )
        
        await asyncio.to_thread(blob_client.upload_blob, video_data, overwrite=True)

# Usage in production:
# azure_storage = AzureVideoStorage(
#     connection_string=os.getenv("AZURE_STORAGE_CONNECTION_STRING"),
#     container_name="videos"
# )