# 프론트엔드 카나리 배포 가이드

## 📁 파일 구조
```
k8s/frontend-only/
├── namespace.yaml    # 네임스페이스
├── frontend.yaml     # 프론트엔드 배포 (stable + canary + HPA)
├── ingress.yaml      # 외부 접근 라우팅
└── README.md         # 이 파일
```

## 🚀 배포 순서

### 1단계: ECR 준비
프론트엔드용 ECR 레포지토리가 필요해요. 테라폼으로 추가하거나 AWS 콘솔에서 생성:
```bash
# AWS CLI로 ECR 생성 (선택사항)
aws ecr create-repository --repository-name frontend --region ap-northeast-2
```

### 2단계: Docker 이미지 빌드
```bash
# 프론트엔드 프로젝트 루트에서 실행
docker build -t frontend:stable .
```

### 3단계: ECR 로그인 & 푸시
```bash
# ECR 로그인
aws ecr get-login-password --region ap-northeast-2 | \
  docker login --username AWS --password-stdin \
  355627705292.dkr.ecr.ap-northeast-2.amazonaws.com

# 이미지 태그 & 푸시
docker tag frontend:stable 355627705292.dkr.ecr.ap-northeast-2.amazonaws.com/frontend:stable
docker push 355627705292.dkr.ecr.ap-northeast-2.amazonaws.com/frontend:stable
```

### 4단계: K8s 배포
```bash
# 네임스페이스 생성
kubectl apply -f k8s/frontend-only/namespace.yaml

# 프론트엔드 배포
kubectl apply -f k8s/frontend-only/frontend.yaml

# Ingress 설정
kubectl apply -f k8s/frontend-only/ingress.yaml

# 또는 한번에
kubectl apply -f k8s/frontend-only/
```

## 🐤 카나리 배포 전략

### 트래픽 분배
- **Stable**: 2개 replica (약 67% 트래픽)
- **Canary**: 1개 replica (약 33% 트래픽)

### 카나리 배포 프로세스
1. 새 버전 이미지를 `canary` 태그로 빌드 & 푸시
2. canary deployment가 자동으로 새 이미지 pull
3. 모니터링 (에러율, 응답시간 확인)
4. 문제 없으면 stable 이미지도 업데이트
5. 완료!

### 새 버전 배포 예시
```bash
# 1. Canary 버전 빌드 & 푸시
docker build -t frontend:canary .
docker tag frontend:canary 355627705292.dkr.ecr.ap-northeast-2.amazonaws.com/frontend:canary
docker push 355627705292.dkr.ecr.ap-northeast-2.amazonaws.com/frontend:canary

# 2. Canary deployment 재시작 (새 이미지 pull)
kubectl rollout restart deployment/frontend-canary -n history-app

# 3. 모니터링 (로그, 메트릭 확인)
kubectl logs -f deployment/frontend-canary -n history-app

# 4. 문제 없으면 Stable도 업데이트
docker tag frontend:canary 355627705292.dkr.ecr.ap-northeast-2.amazonaws.com/frontend:stable
docker push 355627705292.dkr.ecr.ap-northeast-2.amazonaws.com/frontend:stable
kubectl rollout restart deployment/frontend-stable -n history-app
```

## 📊 모니터링 명령어

```bash
# Pod 상태 확인
kubectl get pods -n history-app -l app=frontend

# 로그 확인
kubectl logs -f deployment/frontend-stable -n history-app
kubectl logs -f deployment/frontend-canary -n history-app

# HPA 상태 확인
kubectl get hpa -n history-app

# 서비스 상태 확인
kubectl get svc -n history-app

# Ingress 확인
kubectl get ingress -n history-app
```

## 🔄 롤백
```bash
# Canary 롤백
kubectl rollout undo deployment/frontend-canary -n history-app

# Stable 롤백
kubectl rollout undo deployment/frontend-stable -n history-app
```

## ⚠️ 주의사항

1. **ECR URL**: `frontend.yaml`에서 실제 ECR URL로 변경 필요
2. **도메인**: `ingress.yaml`에서 실제 도메인으로 변경
3. **API URL**: 백엔드 API가 K8s에 배포되어 있어야 함
4. **ALB Ingress Controller**: EKS 클러스터에 설치되어 있어야 함

## 🔧 트러블슈팅

### ImagePullBackOff 에러
```bash
# ECR 인증 확인
kubectl get secret -n history-app

# Pod 상세 정보
kubectl describe pod <pod-name> -n history-app
```

### CrashLoopBackOff 에러
```bash
# 로그 확인
kubectl logs <pod-name> -n history-app

# 이전 로그 확인
kubectl logs <pod-name> -n history-app --previous
```

## 📝 다음 단계
- 백엔드 API들도 K8s에 배포
- 모니터링 도구 설정 (Prometheus, Grafana)
- CI/CD 파이프라인 구축
