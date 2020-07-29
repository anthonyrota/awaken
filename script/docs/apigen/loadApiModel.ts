import { ApiModel } from '@microsoft/api-extractor-model';

export function loadApiModel(apiModelFilePaths: string[]) {
    const apiModel = new ApiModel();

    for (const apiModelFilePath of apiModelFilePaths) {
        apiModel.loadPackage(apiModelFilePath);
    }

    return apiModel;
}
