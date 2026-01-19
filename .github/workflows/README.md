# GitHub Actions CI/CD 설정 가이드

## 🚀 자동 배포 워크플로우

이 워크플로우는 코드를 푸시하면 자동으로 Docker 이미지를 빌드하고 ECR에 푸시합니다.

## 📋 설정 방법

### 1. GitHub Secrets 설정

GitHub 저장소 → Settings → Secrets and variables → Actions → New repository secret

다음 2개의 Secret을 추가하세요:

```
AWS_ACCESS_KEY_ID: <AWS IAM 액세스 키>
AWS_SECRET_ACCESS_KEY: <AWS IAM 시크릿 키>
```

### 2. IAM 권한 설정

GitHub Actions에서 사용할 IAM 사용자에 다음 권한 필요:
- `AmazonEC2ContainerRegistryPowerUser` (ECR 푸시)
- 또는 커스텀 정책:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "*"
    }
  ]
}
```

## 🌿 브랜치 전략

### `main` 브랜치
- **용도**: 프로덕션 stable 버전
- **이미지 태그**: `stable`
- **배포**: 자동으로 `frontend-stable` deployment 업데이트

```bash
git checkout main
git add .
git commit -m "feat: 새 기능 추가"
git push origin main
```

### `canary` 브랜치
- **용도**: 카나리 테스트 버전
- **이미지 태그**: `canary`
- **배포**: 자동으로 `frontend-canary` deployment 업데이트

```bash
git checkout -b canary
git add .
git commit -m "test: 카나리 테스트"
git push origin canary
```

## 📊 워크플로우 동작

1. **코드 푸시** → GitHub Actions 트리거
2. **Docker 이미지 빌드** → Dockerfile 사용
3. **ECR 로그인** → AWS 인증
4. **이미지 푸시** → ECR에 업로드
5. **K8s 배포** (선택) → EKS 클러스터 업데이트

## 🔍 빌드 상태 확인

GitHub 저장소 → Actions 탭에서 실시간 로그 확인 가능

## 🎯 사용 예시

### Stable 배포
```bash
# 1. 기능 개발
git checkout main
git pull origin main

# 2. 코드 수정
# ... 파일 수정 ...

# 3. 커밋 & 푸시 (자동 빌드 시작)
git add .
git commit -m "feat: 새로운 기능 추가"
git push origin main

# 4. GitHub Actions에서 자동으로:
#    - Docker 빌드
#    - ECR 푸시 (frontend:stable)
#    - K8s가 자동으로 새 이미지 pull
```

### Canary 배포
```bash
# 1. Canary 브랜치 생성/체크아웃
git checkout -b canary
# 또는
git checkout canary
git pull origin canary

# 2. 테스트할 코드 수정
# ... 파일 수정 ...

# 3. 커밋 & 푸시
git add .
git commit -m "test: 새 기능 카나리 테스트"
git push origin canary

# 4. 모니터링 후 문제 없으면 main에 머지
git checkout main
git merge canary
git push origin main
```

## ⚙️ 고급 설정

### 자동 K8s 배포 활성화

`deploy.yml` 파일에서 주석 해제:

```yaml
- name: Deploy to EKS
  if: github.ref == 'refs/heads/main'
  run: |
    kubectl rollout restart deployment/frontend-stable -n history-app
```

이를 위해 추가 Secret 필요:
- `KUBE_CONFIG`: EKS 클러스터 kubeconfig

### 슬랙 알림 추가

```yaml
- name: Slack Notification
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## 🐛 트러블슈팅

### ECR 푸시 실패
- AWS credentials 확인
- IAM 권한 확인
- ECR 레포지토리 존재 확인

### 빌드 실패
- Dockerfile 문법 확인
- 의존성 설치 확인
- GitHub Actions 로그 확인

## 📝 참고

- 이미지는 2개 태그로 푸시됨:
  - `stable` 또는 `canary` (브랜치별)
  - `<commit-sha>` (롤백용)
